import 'dotenv/config';
import { z } from 'zod';
import { connectDB } from './config/mongodb.js';
import { connectRedis } from './config/Redis.js';
import { connectPostgres } from './config/Postgrsedb.js';
import { app } from './App.js';

const envSchema = z.object({
    PORT: z.string().default('5000'),
    MONGODB_URI: z.string().min(10, 'MONGODB_URI is required and must be a valid URI'),
    DATABASE_URL: z.string().min(10, 'DATABASE_URL is required for PostgreSQL connection'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRE: z.string().default('7d'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: z.string().optional(),
    REDIS_URL: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.string().optional(),
    RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    process.stderr.write(
        `❌ Invalid environment variables:\n${JSON.stringify(envResult.error.format(), null, 2)}\n`
    );
    process.exit(1);
}

const { logger } = await import('./utils/logger.js');

const start = async () => {
    await connectDB();
    await connectPostgres();
    await connectRedis();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        logger.info(`📡 API: http://localhost:${PORT}/api`);
    });

    const shutdown = (signal) => {
        logger.info(`${signal} received — shutting down gracefully`);
        server.close(() => {
            logger.info('✅ HTTP server closed');
            process.exit(0);
        });
        setTimeout(() => {
            logger.error('Forced shutdown after 10s timeout');
            process.exit(1);
        }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
        logger.error(`Unhandled Promise Rejection: ${reason?.message || reason}`, {
            stack: reason?.stack,
        });
        server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
        logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
        process.exit(1);
    });
};

start();
