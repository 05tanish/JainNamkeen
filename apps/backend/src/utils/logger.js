import winston from 'winston';
import LokiTransport from 'winston-loki';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Log levels ────────────────────────────────────────────────────────────────
const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'blue' };
winston.addColors(colors);

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
});

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

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

if (process.env.LOKI_HOST) {
    const lokiTransport = new LokiTransport({
        host: process.env.LOKI_HOST,
        labels: {
            app: 'ecommerce-backend',
            env: process.env.NODE_ENV || 'development',
            service: 'api'
        },
        json: true,
        format: json(),
        replaceTimestamp: true,
        onConnectionError: (err) => console.error('Loki connection error:', err),
        ...(process.env.LOKI_USERNAME && process.env.LOKI_PASSWORD && {
            basicAuth: `${process.env.LOKI_USERNAME}:${process.env.LOKI_PASSWORD}`
        })
    });
    
    transports.push(lokiTransport);
    console.log('✅ Grafana Loki logging enabled');
}

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

const logger = winston.createLogger({ level, levels, transports, exitOnError: false });

logger.stream = { write: (msg) => logger.http(msg.trim()) };

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

logger.logSecurity = (event, details) => {
    logger.warn('Security Event', { event, ...details, timestamp: new Date().toISOString() });
};

logger.logAudit = (action, details) => {
    logger.info('Audit Event', { action, ...details, timestamp: new Date().toISOString() });
};

export { logger };
