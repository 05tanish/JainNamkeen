import logger from '../utils/logger.js';

/**
 * Centralized error handling middleware.
 * Formats errors consistently and handles specific error types (Mongoose, JWT, etc.).
 */
const errorMiddleware = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to winston
    logger.error(`${err.name}: ${err.message}`, { stack: err.stack });


    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        return res.status(404).json({ success: false, message });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        return res.status(400).json({ success: false, message });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json({ success: false, message });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
    }

    // Default 500 error
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error'
    });
};

export default errorMiddleware;
