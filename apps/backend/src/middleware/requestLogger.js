import logger from '../utils/logger.js';

/**
 * Middleware to log all HTTP requests
 */
export const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.http('Incoming Request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?._id,
    });

    // Intercept response to log completion
    const originalSend = res.send.bind(res);

    res.send = function (body) {
        const duration = Date.now() - startTime;

        logger.logRequest(req, res, duration);

        // Log slow requests (> 1 second)
        if (duration > 1000) {
            logger.warn('Slow Request Detected', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration}ms`,
                userId: req.user?._id,
            });
        }

        return originalSend(body);
    };

    next();
};

export default requestLogger;
