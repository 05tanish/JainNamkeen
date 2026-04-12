import winston from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Log levels ────────────────────────────────────────────────────────────────
const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'blue' };
winston.addColors(colors);

// ── Logs directory — use process.cwd() not __dirname ──────────────────────────
// __dirname here = apps/backend/src/utils/, so ../../logs = apps/logs/ (wrong)
// process.cwd() = apps/backend/ → logs/ = apps/backend/logs/ (correct)
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// ── Console format ────────────────────────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
});

// ── Level ─────────────────────────────────────────────────────────────────────
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// ── Transports ────────────────────────────────────────────────────────────────
const transports = [
    new winston.transports.Console({
        format: combine(
            colorize({ all: true }),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            consoleFormat
        ),
    }),
];

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
    const fileCommon = combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    );
    const fileOpts = { maxsize: 5_242_880, maxFiles: 5, format: fileCommon };

    transports.push(
        new winston.transports.File({ ...fileOpts, filename: path.join(logsDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ ...fileOpts, filename: path.join(logsDir, 'combined.log') }),
        new winston.transports.File({ ...fileOpts, filename: path.join(logsDir, 'http.log'), level: 'http' }),
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            maxsize: 10_485_760,
            maxFiles: 10,
            format: fileCommon,
        })
    );
}

// ── Logger ────────────────────────────────────────────────────────────────────
const logger = winston.createLogger({ level, levels, transports, exitOnError: false });

// Morgan-compatible stream
logger.stream = { write: (msg) => logger.http(msg.trim()) };

// ── Structured helpers ────────────────────────────────────────────────────────

/**
 * Log an HTTP request/response pair (called from requestLogger middleware).
 * Uses req.socket (Node 18+) — req.connection is deprecated.
 */
logger.logRequest = (req, res, duration) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?._id,
    });
};

/**
 * Log an application error with optional request context.
 */
logger.logError = (error, req = null) => {
    const log = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    };
    if (req) {
        log.method = req.method;
        log.url = req.originalUrl;
        log.ip = req.ip || req.socket?.remoteAddress;
        log.userId = req.user?._id;
    }
    logger.error('Application Error', log);
};

/**
 * Log a security-relevant event (auth failures, CORS blocks, etc.).
 */
logger.logSecurity = (event, details) => {
    logger.warn('Security Event', { event, ...details, timestamp: new Date().toISOString() });
};

/**
 * Log an audit event (admin action, data mutation, etc.).
 */
logger.logAudit = (action, details) => {
    logger.info('Audit Event', { action, ...details, timestamp: new Date().toISOString() });
};

export default logger;
