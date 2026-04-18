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
import { sanitizeAll } from './utils/sanitize.js';
import { provideCsrfToken, verifyCsrfToken } from './middleware/csrf.js';

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
import paymentRoutes from './modules/payments/payment.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(hpp());
app.use(cookieParser());

app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// ─── CORS must be registered FIRST ────────────────────────────────────────────
// Any middleware that can send a response (rate limiter, CSRF, etc.) must come
// AFTER CORS so that error responses (429, 403) still carry the
// Access-Control-Allow-Origin header the browser requires.
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN'],
    credentials: true,
    optionsSuccessStatus: 200,
}));

// ─── Rate limiters (after CORS so 429 responses include CORS headers) ─────────
// In development React StrictMode + Vite HMR can fire many requests quickly,
// so we use a generous limit in dev and a strict one in production.
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
        (process.env.NODE_ENV === 'production' ? 200 : 1000),
    message: { success: false, statusCode: 429, message: 'Too many requests, please try again later' },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Strict rate limiter for auth endpoints (login / register only)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'production' ? 5 : 50,
    message: {
        success: false,
        statusCode: 429,
        message: 'Too many login attempts. Please try again in 15 minutes'
    },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true
});


app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Add input sanitization middleware
app.use(sanitizeAll);

app.use(requestLogger);

// CSRF token endpoint - must be before CSRF verification
app.get('/api/csrf-token', provideCsrfToken, (_req, res) => {
    res.json({ 
        success: true, 
        message: 'CSRF token provided in cookie' 
    });
});

// Apply CSRF protection to all state-changing requests
app.use('/api/', verifyCsrfToken);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Apply strict rate limiting to auth routes BEFORE registering them
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
app.use('/api/payments', paymentRoutes);

app.get('/api/health', async (_req, res) => {
    try {
        const { prisma } = await import('./config/Postgrsedb.js');
        const { isRedisConnected } = await import('./config/Redis.js');
        const mongoose = await import('mongoose');

        // Check database connections
        const checks = {
            postgres: 'unknown',
            mongodb: 'unknown',
            redis: 'unknown'
        };

        // Check PostgreSQL
        try {
            await prisma.$queryRaw`SELECT 1`;
            checks.postgres = 'connected';
        } catch {
            checks.postgres = 'disconnected';
        }

        // Check MongoDB
        checks.mongodb = mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Check Redis
        checks.redis = isRedisConnected() ? 'connected' : 'disconnected';

        const allHealthy = checks.postgres === 'connected' && checks.mongodb === 'connected';

        res.status(allHealthy ? 200 : 503).json({
            success: allHealthy,
            statusCode: allHealthy ? 200 : 503,
            message: allHealthy ? 'All systems operational' : 'Some services unavailable',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            services: checks
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            statusCode: 503,
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
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
