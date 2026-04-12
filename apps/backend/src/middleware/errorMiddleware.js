import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Centralized error handling middleware.
 * Recognises ApiError instances and normalises Mongoose/JWT errors into a
 * consistent JSON envelope: { success, statusCode, message, errors }.
 */
const errorMiddleware = (err, req, res, next) => {
    // Log every error with request context
    logger.logError(err, req);

    // ── Already a known operational ApiError ──────────────────────────────────
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors,
        });
    }

    // ── Mongoose: bad ObjectId ────────────────────────────────────────────────
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: `Invalid ID: ${err.value}`,
            errors: [],
        });
    }

    // ── Mongoose: duplicate key ───────────────────────────────────────────────
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = err.keyValue?.[field];
        return res.status(409).json({
            success: false,
            statusCode: 409,
            message: `Duplicate value: ${field} '${value}' already exists`,
            errors: [],
        });
    }

    // ── Mongoose: validation error ────────────────────────────────────────────
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Validation failed',
            errors,
        });
    }

    // ── JWT errors ────────────────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Invalid token',
            errors: [],
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Token expired, please log in again',
            errors: [],
        });
    }

    // ── CORS error ────────────────────────────────────────────────────────────
    if (err.message && err.message.includes('Not allowed by CORS')) {
        return res.status(403).json({
            success: false,
            statusCode: 403,
            message: 'CORS: origin not allowed',
            errors: [],
        });
    }

    // ── Default 500 ───────────────────────────────────────────────────────────
    const statusCode = err.statusCode || err.status || 500;
    const message =
        process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: [],
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

export default errorMiddleware;
