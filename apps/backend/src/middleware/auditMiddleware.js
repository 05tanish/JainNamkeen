import { createAuditLog } from '../utils/auditLogger.js';
import logger from '../utils/logger.js';

/**
 * Middleware to automatically log API requests to audit log
 */
export const auditMiddleware = (action, resource) => {
    return async (req, res, next) => {
        const startTime = Date.now();

        // Store original res.json to intercept response
        const originalJson = res.json.bind(res);

        res.json = function (body) {
            const duration = Date.now() - startTime;
            const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE';

            // Create audit log asynchronously (don't wait for it)
            createAuditLog({
                userId: req.user?._id,
                userEmail: req.user?.email,
                action,
                resource,
                resourceId: req.params.id || body?._id || body?.id,
                method: req.method,
                endpoint: req.originalUrl,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                changes: req.body,
                metadata: {
                    query: req.query,
                    params: req.params,
                },
                status,
                errorMessage: status === 'FAILURE' ? body?.message : undefined,
                duration,
            }).catch(err => {
                logger.error('Failed to create audit log in middleware', { error: err.message });
            });

            return originalJson(body);
        };

        next();
    };
};

/**
 * Middleware to log security events
 */
export const securityAuditMiddleware = (req, res, next) => {
    const startTime = Date.now();

    // Store original res.status to intercept security-related responses
    const originalStatus = res.status.bind(res);

    res.status = function (code) {
        // Log security events for specific status codes
        if (code === 401 || code === 403) {
            const duration = Date.now() - startTime;
            const action = code === 401 ? 'UNAUTHORIZED_ACCESS' : 'FORBIDDEN_ACCESS';

            createAuditLog({
                userId: req.user?._id,
                userEmail: req.user?.email || req.body?.email,
                action,
                resource: 'AUTH',
                method: req.method,
                endpoint: req.originalUrl,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                metadata: {
                    attemptedResource: req.originalUrl,
                    userRole: req.user?.role,
                },
                status: 'WARNING',
                duration,
            }).catch(err => {
                logger.error('Failed to create security audit log', { error: err.message });
            });

            logger.logSecurity(action, {
                endpoint: req.originalUrl,
                ip: req.ip || req.connection.remoteAddress,
                userId: req.user?._id,
            });
        }

        return originalStatus(code);
    };

    next();
};

/**
 * Middleware to log failed login attempts
 */
export const loginAuditMiddleware = async (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        const duration = Date.now() - startTime;
        const isSuccess = res.statusCode === 200;
        const action = isSuccess ? 'USER_LOGIN' : 'USER_LOGIN_FAILED';

        createAuditLog({
            userId: isSuccess ? body?.user?._id : null,
            userEmail: req.body?.email,
            action,
            resource: 'AUTH',
            method: req.method,
            endpoint: req.originalUrl,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            metadata: {
                email: req.body?.email,
            },
            status: isSuccess ? 'SUCCESS' : 'FAILURE',
            errorMessage: !isSuccess ? body?.message : undefined,
            duration,
        }).catch(err => {
            logger.error('Failed to create login audit log', { error: err.message });
        });

        if (!isSuccess) {
            logger.logSecurity('LOGIN_FAILED', {
                email: req.body?.email,
                ip: req.ip || req.connection.remoteAddress,
                reason: body?.message,
            });
        }

        return originalJson(body);
    };

    next();
};

/**
 * Middleware to log data changes (for PUT/PATCH/DELETE)
 */
export const changeAuditMiddleware = (resource) => {
    return async (req, res, next) => {
        // For update operations, fetch the original data
        if ((req.method === 'PUT' || req.method === 'PATCH') && req.params.id) {
            try {
                // Store original data in req for comparison later
                // This should be populated by the controller
                req.auditOriginalData = null; // Controller should set this
            } catch (error) {
                logger.error('Failed to fetch original data for audit', { error: error.message });
            }
        }

        const startTime = Date.now();
        const originalJson = res.json.bind(res);

        res.json = function (body) {
            const duration = Date.now() - startTime;
            const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE';

            let action = '';
            switch (req.method) {
                case 'POST':
                    action = `${resource}_CREATE`;
                    break;
                case 'PUT':
                case 'PATCH':
                    action = `${resource}_UPDATE`;
                    break;
                case 'DELETE':
                    action = `${resource}_DELETE`;
                    break;
                default:
                    action = `${resource}_${req.method}`;
            }

            const changes = {};
            if (req.auditOriginalData && req.body) {
                // Compare original and new data
                Object.keys(req.body).forEach(key => {
                    if (JSON.stringify(req.auditOriginalData[key]) !== JSON.stringify(req.body[key])) {
                        changes[key] = {
                            before: req.auditOriginalData[key],
                            after: req.body[key],
                        };
                    }
                });
            }

            createAuditLog({
                userId: req.user?._id,
                userEmail: req.user?.email,
                action,
                resource,
                resourceId: req.params.id || body?._id || body?.id,
                method: req.method,
                endpoint: req.originalUrl,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                changes: Object.keys(changes).length > 0 ? changes : req.body,
                metadata: {
                    query: req.query,
                    params: req.params,
                },
                status,
                errorMessage: status === 'FAILURE' ? body?.message : undefined,
                duration,
            }).catch(err => {
                logger.error('Failed to create change audit log', { error: err.message });
            });

            return originalJson(body);
        };

        next();
    };
};

export default {
    auditMiddleware,
    securityAuditMiddleware,
    loginAuditMiddleware,
    changeAuditMiddleware,
};
