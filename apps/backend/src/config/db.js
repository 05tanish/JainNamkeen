import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options are defaults in Mongoose 6+ but explicit for clarity
            serverSelectionTimeoutMS: 5000,  // Fail fast if MongoDB is unreachable
            socketTimeoutMS: 45000,
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Graceful disconnect on process termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed due to app termination');
        });
    } catch (error) {
        logger.error(`❌ MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
