import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import hpp from 'hpp';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { errorMiddleware } from './middleware/errorMiddleware.js';
import { requestLogger } from './middleware/requestLogger.js';

import authRoutes from './modules/auth/auth.routes.js';
import productRoutes from './modules/products/product.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import userRoutes from './modules/users/user.routes.js';
import adminAnalyticsRoutes from './modules/admin/admin.routes.js';
import couponRoutes from './modules/coupons/coupon.routes.js';
import bannerRoutes from './modules/banners/banner.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import pageRoutes from './modules/pages/page.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(hpp());
app.use(cookieParser());

app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { success: false, statusCode: 429, message: 'Too many requests, please try again later' },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});
app.use('/api/', limiter);

const getAllowedOrigins = () => {
    const defaults = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ];
    if (process.env.FRONTEND_URL) {
        const custom = process.env.FRONTEND_URL.split(',').map(o => o.trim());
        return [...new Set([...defaults, ...custom])];
    }
    return defaults;
};

app.use(cors({
    origin: (origin, callback) => {
        const allowed = getAllowedOrigins();
        if (!origin || allowed.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminAnalyticsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        statusCode: 200,
        message: 'Sangam Namkeen API is running 🍿',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        errors: [],
    });
});

app.use(errorMiddleware);

export { app };
