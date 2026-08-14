import 'dotenv/config';
import { validateEnv, printEnvConfig, performStartupChecks } from './utils/validateEnv.js';
import { connectDB } from './config/mongodb.js';
import { connectRedis } from './config/Redis.js';
import { connectPostgres, disconnectPostgres } from './config/Postgrsedb.js';
import mongoose from 'mongoose';
import { app } from './App.js';

// Validate environment variables at startup
const env = validateEnv();
printEnvConfig(env);

const { logger } = await import('./utils/logger.js');

const start = async () => {
    // Connect to databases
    await connectDB();
    await connectPostgres();
    await connectRedis();

    // Perform startup health checks
    await performStartupChecks();

    const PORT = env.PORT || 5000;
    const server = app.listen(PORT, "0.0.0.0", () => {
        logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
        logger.info(`📡 API: http://localhost:${PORT}/api`);
        logger.info(`📊 Metrics: http://localhost:${PORT}/metrics`);
        logger.info(`🏥 Health: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal) => {
        logger.info(`${signal} received — shutting down gracefully`);
        server.close(async () => {
            logger.info('✅ HTTP server closed');
            try {
                await disconnectPostgres();
                logger.info('✅ PostgreSQL pool closed');
            } catch (err) {
                logger.warn(`PostgreSQL disconnect error: ${err.message}`);
            }
            try {
                await mongoose.disconnect();
                logger.info('✅ MongoDB connection closed');
            } catch (err) {
                logger.warn(`MongoDB disconnect error: ${err.message}`);
            }
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

