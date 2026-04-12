import logger from '../utils/logger.js';

/**
 * HTTP request/response logger middleware.
 * Logs method, URL, status, duration, IP and user for every request.
 * Warns on slow requests (> 1 000 ms).
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Resolve IP — req.connection is deprecated in Node 18+; use req.socket
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';



    // Intercept res.send so we can log after the response is written
    const originalSend = res.send.bind(res);
    res.send = function (body) {
        const duration = Date.now() - startTime;

        logger.logRequest(req, res, duration);

        if (duration > 1000) {
            logger.warn('Slow Request', {
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
