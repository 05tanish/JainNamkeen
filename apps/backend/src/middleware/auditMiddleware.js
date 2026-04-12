import { createAuditLog } from '../utils/auditLogger.js';
import logger from '../utils/logger.js';

/**
 * Helper — resolve the client IP safely (req.connection is deprecated in Node 18+).
 */
const getIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

/**
 * Generic audit middleware — logs any admin action on a resource.
 *
 * Usage: router.post('/', auth, role('admin'), auditMiddleware('PRODUCT_CREATE', 'Product'), createProduct)
 */
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

/**
 * Security audit middleware — logs every 401 and 403 response automatically.
 * Add once to your app in App.js to cover all routes.
 */
export const securityAuditMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const originalStatus = res.status.bind(res);

    res.status = function (code) {
        if (code === 401 || code === 403) {
            const action = code === 401 ? 'UNAUTHORIZED_ACCESS' : 'FORBIDDEN_ACCESS';
            const duration = Date.now() - startTime;

            createAuditLog({
                userId: req.user?._id,
                userEmail: req.user?.email || req.body?.email,
                action,
                resource: 'AUTH',
                method: req.method,
                endpoint: req.originalUrl,
                ipAddress: getIp(req),
                userAgent: req.get('user-agent'),
                metadata: { attemptedResource: req.originalUrl, userRole: req.user?.role },
                status: 'WARNING',
                duration,
            }).catch(err =>
                logger.error('securityAuditMiddleware: failed to create log', { error: err.message })
            );

            logger.logSecurity(action, {
                endpoint: req.originalUrl,
                ip: getIp(req),
                userId: req.user?._id,
            });
        }
        return originalStatus(code);
    };

    next();
};

/**
 * Login-specific audit middleware — logs USER_LOGIN and USER_LOGIN_FAILED.
 * Add to POST /api/auth/login route only.
 *
 * NOTE: auth controller uses `sendTokenResponse` which structures response as
 *       { success, message, data: { _id, ... } } — so we read body?.data?._id.
 */
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
            logger.logSecurity('LOGIN_FAILED', {
                email: req.body?.email,
                ip: getIp(req),
                reason: body?.message,
            });
        }

        return originalJson(body);
    };

    next();
};

/**
 * Change audit middleware — logs data mutations (POST/PUT/PATCH/DELETE).
 * Attach to individual admin routes where detailed change tracking is required.
 */
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

export default {
    auditMiddleware,
    securityAuditMiddleware,
    loginAuditMiddleware,
    changeAuditMiddleware,
};
