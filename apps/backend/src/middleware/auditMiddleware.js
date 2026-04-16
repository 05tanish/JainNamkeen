import { createAuditLog, logSecurityEvent } from '../utils/auditLogger.js';
import { logger } from '../utils/logger.js';

const getIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

export const auditMiddleware = (action, resource) => (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        const duration = Date.now() - startTime;
        const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE';

        createAuditLog({
            userId: req.user?._id,
            userEmail: req.user?.email,
            action,
            resource,
            resourceId: req.params?.id ?? body?.data?._id ?? body?._id,
            method: req.method,
            endpoint: req.originalUrl,
            ipAddress: getIp(req),
            userAgent: req.get('user-agent'),
            changes: req.body,
            metadata: { query: req.query, params: req.params },
            status,
            errorMessage: status === 'FAILURE' ? body?.message : undefined,
            duration,
        }).catch(err =>
            logger.error('auditMiddleware: failed to create log', { error: err.message })
        );

        return originalJson(body);
    };

    next();
};

export const securityAuditMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const originalStatus = res.status.bind(res);

    res.status = function (code) {
        if (code === 401 || code === 403) {
            const event = code === 401 ? 'UNAUTHORIZED_ACCESS' : 'FORBIDDEN_ACCESS';
            const duration = Date.now() - startTime;

            logSecurityEvent({
                userId: req.user?._id,
                userEmail: req.user?.email || req.body?.email,
                event,
                ipAddress: getIp(req),
                userAgent: req.get('user-agent'),
                endpoint: req.originalUrl,
                metadata: { 
                    attemptedResource: req.originalUrl, 
                    userRole: req.user?.role,
                    duration 
                },
                severity: 'WARNING'
            });

            logger.logSecurity(event, {
                endpoint: req.originalUrl,
                ip: getIp(req),
                userId: req.user?._id,
            });
        }
        return originalStatus(code);
    };

    next();
};

export const loginAuditMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        const duration = Date.now() - startTime;
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        const action = isSuccess ? 'USER_LOGIN' : 'USER_LOGIN_FAILED';

        createAuditLog({
            userId: isSuccess ? (body?.data?._id ?? null) : null,
            userEmail: req.body?.email,
            action,
            resource: 'AUTH',
            method: req.method,
            endpoint: req.originalUrl,
            ipAddress: getIp(req),
            userAgent: req.get('user-agent'),
            metadata: { email: req.body?.email },
            status: isSuccess ? 'SUCCESS' : 'FAILURE',
            errorMessage: !isSuccess ? body?.message : undefined,
            duration,
        }).catch(err =>
            logger.error('loginAuditMiddleware: failed to create log', { error: err.message })
        );

        if (!isSuccess) {
            logSecurityEvent({
                userEmail: req.body?.email,
                event: 'LOGIN_FAILED',
                ipAddress: getIp(req),
                userAgent: req.get('user-agent'),
                endpoint: req.originalUrl,
                metadata: { reason: body?.message, duration },
                severity: 'WARNING'
            });
        }

        return originalJson(body);
    };

    next();
};

export const changeAuditMiddleware = (resource) => (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        const duration = Date.now() - startTime;
        const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE';

        const methodActionMap = {
            POST: `${resource}_CREATE`,
            PUT: `${resource}_UPDATE`,
            PATCH: `${resource}_UPDATE`,
            DELETE: `${resource}_DELETE`,
        };
        const action = methodActionMap[req.method] ?? `${resource}_${req.method}`;

        createAuditLog({
            userId: req.user?._id,
            userEmail: req.user?.email,
            action,
            resource,
            resourceId: req.params?.id ?? body?.data?._id ?? body?._id,
            method: req.method,
            endpoint: req.originalUrl,
            ipAddress: getIp(req),
            userAgent: req.get('user-agent'),
            changes: req.body,
            metadata: { query: req.query, params: req.params },
            status,
            errorMessage: status === 'FAILURE' ? body?.message : undefined,
            duration,
        }).catch(err =>
            logger.error('changeAuditMiddleware: failed to create log', { error: err.message })
        );

        return originalJson(body);
    };

    next();
};
