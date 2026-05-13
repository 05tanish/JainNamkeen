// =============================================================================
// Request ID Middleware
// =============================================================================
// Generates a unique ID for each HTTP request to enable request tracing
// across logs, making it easy to debug issues by following a single request

import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * 
 * Generates a unique identifier for each incoming request and:
 * 1. Attaches it to the request object (req.id)
 * 2. Adds it to response headers (X-Request-ID)
 * 3. Makes it available for logging throughout the request lifecycle
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const requestIdMiddleware = (req, res, next) => {
    // Check if request already has an ID (from client or load balancer)
    const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
    
    // Use existing ID or generate new one
    req.id = existingId || `req_${randomUUID()}`;
    
    // Add to response headers so client can reference it
    res.setHeader('X-Request-ID', req.id);
    
    // Also add correlation ID header for distributed tracing
    res.setHeader('X-Correlation-ID', req.id);
    
    // Continue to next middleware
    next();
};

/**
 * Get request ID from request object
 * Useful helper function for accessing request ID in route handlers
 * 
 * @param {Object} req - Express request object
 * @returns {string} Request ID
 */
export const getRequestId = (req) => {
    return req.id || 'unknown';
};

/**
 * Add request ID to logger context
 * Creates a child logger with request ID automatically included
 * 
 * @param {Object} logger - Winston logger instance
 * @param {Object} req - Express request object
 * @returns {Object} Child logger with request ID
 */
export const addRequestIdToLogger = (logger, req) => {
    return logger.child({
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id
    });
};
