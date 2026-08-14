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

// ── Create logger FIRST — Loki is added below so its callbacks safely reference logger ─
const logger = winston.createLogger({ level, levels, transports, exitOnError: false });

// ── Loki Transport (attached after logger is created to avoid TDZ crash) ─────
// If LOKI_HOST is set and Loki fails immediately at startup, the onConnectionError
// callback fires synchronously. By adding Loki AFTER logger exists, `logger`
// is always initialized by the time any callback runs.
if (process.env.LOKI_HOST) {
    let lokiRetries = 0;
    const MAX_LOKI_RETRIES = 3;
    let lokiEnabled = true;
    let lokiTransportRef = null;

    try {
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
            timeout: 5000,
            onConnectionError: (err) => {
                lokiRetries++;
                if (lokiRetries <= MAX_LOKI_RETRIES) {
                    logger.warn(`⚠️  Loki connection error (attempt ${lokiRetries}/${MAX_LOKI_RETRIES}): ${err.message}`);
                } else if (lokiEnabled) {
                    lokiEnabled = false;
                    logger.warn(`❌ Loki unavailable after ${MAX_LOKI_RETRIES} attempts — logging to Loki disabled`);
                    if (lokiTransportRef) {
                        try {
                            logger.remove(lokiTransportRef);
                            logger.info('Loki transport removed from logger');
                        } catch (removeErr) {
                            logger.warn(`Failed to remove Loki transport: ${removeErr.message}`);
                        }
                    }
                }
            },
            ...(process.env.LOKI_USERNAME && process.env.LOKI_PASSWORD && {
                basicAuth: `${process.env.LOKI_USERNAME}:${process.env.LOKI_PASSWORD}`
            })
        });

        lokiTransport.on('error', (err) => {
            lokiRetries++;
            if (lokiRetries <= MAX_LOKI_RETRIES) {
                logger.warn(`⚠️  Loki transport error (attempt ${lokiRetries}/${MAX_LOKI_RETRIES}): ${err.message}`);
            } else if (lokiEnabled) {
                lokiEnabled = false;
                logger.warn(`❌ Loki transport failed after ${MAX_LOKI_RETRIES} attempts — continuing without Loki`);
                if (lokiTransportRef) {
                    try {
                        logger.remove(lokiTransportRef);
                        logger.info('Loki transport removed from logger');
                    } catch (removeErr) {
                        logger.warn(`Failed to remove Loki transport: ${removeErr.message}`);
                    }
                }
            }
        });

        lokiTransport.on('finish', () => {
            if (lokiRetries === 0) {
                logger.info('✅ Grafana Loki logging enabled');
            }
        });

        lokiTransportRef = lokiTransport;
        // Add Loki transport dynamically — logger already exists at this point
        logger.add(lokiTransport);
    } catch (err) {
        logger.warn(`⚠️  Failed to initialize Loki transport: ${err.message} — logging to Loki disabled`);
    }
}

logger.stream = { write: (msg) => logger.http(msg.trim()) };

logger.logRequest = (req, res, duration) => {
    logger.http('HTTP Request', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
        module: 'http'
    });
};

logger.logError = (error, req = null) => {
    const log = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        module: 'error'
    };
    if (req) {
        log.requestId = req.id;
        log.method = req.method;
        log.url = req.originalUrl;
        log.ip = req.ip || req.socket?.remoteAddress;
        log.userId = req.user?.id;
    }
    logger.error('Application Error', log);
};

logger.logSecurity = (event, details) => {
    logger.warn('Security Event', { 
        event, 
        ...details, 
        module: 'security',
        timestamp: new Date().toISOString() 
    });
};

logger.logAudit = (action, details) => {
    logger.info('Audit Event', { 
        action, 
        ...details, 
        module: 'audit',
        timestamp: new Date().toISOString() 
    });
};

/**
 * Create a child logger with request context
 * Use this in route handlers to automatically include request ID
 */
logger.withRequest = (req) => {
    return logger.child({
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id
    });
};

/**
 * Log with module context
 * Use this to tag logs by module (auth, orders, products, etc.)
 */
logger.withModule = (moduleName) => {
    return logger.child({
        module: moduleName
    });
};

export { logger };
