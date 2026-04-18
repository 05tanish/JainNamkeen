import { randomUUID } from 'crypto';

/**
 * Middleware to add unique request ID for tracing
 */
export const requestId = (req, res, next) => {
    // Use existing request ID from header or generate new one
    req.id = req.headers['x-request-id'] || randomUUID();
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id);
    
    next();
};
