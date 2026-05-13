import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const isMongoConnected = () => isConnected;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
        });

        isConnected = true;
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            isConnected = false;
            logger.error(`MongoDB error: ${err.message}`);
        });

        mongoose.connection.on('reconnected', () => {
            isConnected = true;
            logger.info('MongoDB reconnected');
        });

        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed due to app termination');
                process.exit(0);
            } catch (error) {
                logger.error('Error closing MongoDB:', error);
                process.exit(1);
            }
        });
    } catch (error) {
        isConnected = false;
        logger.warn(`⚠️  MongoDB unavailable: ${error.message} — audit logs disabled`);
        // Don't crash the app, just continue without MongoDB
        logger.info('Application will continue without MongoDB (audit logs disabled)');
    }
};

export { connectDB };
