import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware = (err, req, res, _next) => {
    // Log error for developers (not shown to users)
    logger.logError(err, req);

    // Handle known ApiError instances
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors,
        });
    }

    // Handle Prisma errors
    if (err.code === 'P2002') {
        // Unique constraint violation
        const field = err.meta?.target?.[0] || 'field';
        return res.status(409).json({
            success: false,
            statusCode: 409,
            message: `This ${field} is already in use`,
            errors: [],
        });
    }

    if (err.code === 'P2025') {
        // Record not found
        return res.status(404).json({
            success: false,
            statusCode: 404,
            message: 'The requested resource was not found',
            errors: [],
        });
    }

    if (err.code === 'P2003') {
        // Foreign key constraint failed
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Invalid reference to related data',
            errors: [],
        });
    }

    if (err.code?.startsWith('P')) {
        // Other Prisma errors
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Database operation failed',
            errors: [],
        });
    }

    // Handle MongoDB CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Invalid ID format',
            errors: [],
        });
    }

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({
            success: false,
            statusCode: 409,
            message: `This ${field} is already in use`,
            errors: [],
        });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors || {}).map((e) => e.message);
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Please check your input and try again',
            errors,
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Please log in to continue',
            errors: [],
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Your session has expired. Please log in again',
            errors: [],
        });
    }

    // Handle CORS errors
    if (err.message && err.message.includes('Not allowed by CORS')) {
        return res.status(403).json({
            success: false,
            statusCode: 403,
            message: 'Access denied',
            errors: [],
        });
    }

    // Handle multer file upload errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: 'File size is too large',
                errors: [],
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: 'Too many files uploaded',
                errors: [],
            });
        }
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'File upload failed',
            errors: [],
        });
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        const errors = err.errors?.map(e => e.message) || [];
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Please check your input and try again',
            errors,
        });
    }

    // Handle rate limit errors
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            statusCode: 429,
            message: 'Too many requests. Please try again later',
            errors: [],
        });
    }

    // Default error response (hide technical details in production)
    const statusCode = err.statusCode || err.status || 500;
    const message =
        process.env.NODE_ENV === 'production'
            ? 'Something went wrong. Please try again later'
            : err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: [],
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};
