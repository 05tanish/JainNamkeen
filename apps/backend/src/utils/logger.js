import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${stack || message} ${metaStr}`;
});

// Create logs directory path
const logsDir = path.join(__dirname, '../../logs');

// Determine log level based on environment
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            consoleFormat
        ),
    }),
];

// Add file transports in production or if explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
    transports.push(
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                json()
            ),
        }),
        
        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                json()
            ),
        }),
        
        // HTTP requests log
        new winston.transports.File({
            filename: path.join(logsDir, 'http.log'),
            level: 'http',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                json()
            ),
        }),
        
        // Audit log file
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                json()
            ),
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level,
    levels,
    transports,
    exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Helper methods for structured logging
logger.logRequest = (req, res, duration) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?._id,
    });
};

logger.logError = (error, req = null) => {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        name: error.name,
    };

    if (req) {
        errorLog.method = req.method;
        errorLog.url = req.originalUrl;
        errorLog.ip = req.ip || req.connection.remoteAddress;
        errorLog.userId = req.user?._id;
    }

    logger.error('Application Error', errorLog);
};

logger.logSecurity = (event, details) => {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString(),
    });
};

logger.logAudit = (action, details) => {
    logger.info('Audit Event', {
        action,
        ...details,
        timestamp: new Date().toISOString(),
    });
};

export default logger;
