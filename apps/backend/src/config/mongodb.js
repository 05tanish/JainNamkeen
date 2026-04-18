import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

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
        logger.error(`❌ MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

export { connectDB };
