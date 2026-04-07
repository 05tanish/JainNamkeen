import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import errorMiddleware from './middleware/errorMiddleware.js';

// Route imports (Modular Monolith structure)
import authRoutes from './modules/auth/auth.routes.js';
import productRoutes from './modules/products/product.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import userRoutes from './modules/users/user.routes.js';
import adminAnalyticsRoutes from './modules/admin/admin.routes.js';
import couponRoutes from './modules/coupons/coupon.routes.js';
import bannerRoutes from './modules/banners/banner.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import pageRoutes from './modules/pages/page.routes.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment Variable Validation
const envSchema = z.object({
    PORT: z.string().default('5000'),
    // z.string().url() only accepts http/https — MongoDB Atlas URIs use mongodb+srv://
    // so we use min(10) to just confirm the variable is set and non-trivial.
    MONGODB_URI: z.string().min(10, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().min(32, 'JWT Secret should be at least 32 characters long'),
    JWT_EXPIRE: z.string().default('7d'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: z.string().optional(),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(envResult.error.format(), null, 2));
    process.exit(1);
}

const app = express();

// Connect to MongoDB
connectDB();

// --- Security Middleware ---
app.use(helmet()); // Set security HTTP headers
// express-mongo-sanitize is incompatible with Express 5 getters and Zod prevents NoSQL injection natively
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(cookieParser()); // Parse cookies

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});
app.use('/api/', limiter);

// --- General Middleware ---
const getAllowedOrigins = () => {
    const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
    if (process.env.FRONTEND_URL) {
        const customOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
        return [...new Set([...defaultOrigins, ...customOrigins])];
    }
    return defaultOrigins;
};

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        const allowedOrigins = getAllowedOrigins();
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10kb' })); // Body parser with limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files from root uploads (../../uploads relative to src/)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminAnalyticsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pages', pageRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sangam Namkeen API is running 🍿' });
});

// Error handling
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
});
