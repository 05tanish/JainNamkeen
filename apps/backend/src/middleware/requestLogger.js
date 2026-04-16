import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
    const startTime = Date.now();

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
