import { logger } from './logger.js';

const SENSITIVE_FIELDS = new Set(['password', 'token', 'secret', 'authorization', 'creditCard', 'cvv', 'apiKey', 'privateKey']);

/** Strip sensitive keys from an object before logging. */
const sanitizeData = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    return Object.fromEntries(
        Object.entries(obj).filter(([k]) => !SENSITIVE_FIELDS.has(k.toLowerCase()))
    );
};

/**
 * Create an audit log entry
 * Logs to Grafana Loki via Winston with structured metadata
 */
export const createAuditLog = async ({
    userId,
    userEmail,
    action,
    resource,
    resourceId,
    method,
    endpoint,
    ipAddress,
    userAgent,
    changes,
    metadata,
    status = 'SUCCESS',
    errorMessage,
    duration
}) => {
    try {
        const auditData = {
            // Core audit fields
            userId: userId?.toString(),
            userEmail,
            action,
            resource,
            resourceId: resourceId?.toString(),
            
            // Request context
            method,
            endpoint,
            ipAddress,
            userAgent,
            
            // Change tracking
            changes: sanitizeData(changes),
            metadata: sanitizeData(metadata),
            
            // Status
            status,
            errorMessage,
            duration,
            
            // Timestamp
            timestamp: new Date().toISOString(),
            
            // Labels for Loki filtering
            labels: {
                type: 'audit',
                action,
                resource,
                status,
                userId: userId?.toString() || 'anonymous'
            }
        };

        logger.info('AUDIT', auditData);

        return auditData;
    } catch (error) {
        logger.error('Failed to create audit log', {
            error: error.message,
            action,
            resource
        });
    }
};

export const logSecurityEvent = ({
    userId,
    userEmail,
    event,
    ipAddress,
    userAgent,
    endpoint,
    metadata,
    severity = 'WARNING'
}) => {
    try {
        const securityData = {
            userId: userId?.toString(),
            userEmail,
            event,
            ipAddress,
            userAgent,
            endpoint,
            metadata: sanitizeData(metadata),
            severity,
            timestamp: new Date().toISOString(),
            labels: {
                type: 'security',
                event,
                severity,
                userId: userId?.toString() || 'anonymous'
            }
        };

        logger.warn('SECURITY_EVENT', securityData);

        return securityData;
    } catch (error) {
        logger.error('Failed to log security event', {
            error: error.message,
            event
        });
    }
};

export const logUserActivity = ({
    userId,
    userEmail,
    activity,
    ipAddress,
    userAgent,
    metadata
}) => {
    try {
        const activityData = {
            userId: userId?.toString(),
            userEmail,
            activity,
            ipAddress,
            userAgent,
            metadata: sanitizeData(metadata),
            timestamp: new Date().toISOString(),
            labels: {
                type: 'user_activity',
                activity,
                userId: userId?.toString()
            }
        };

        logger.info('USER_ACTIVITY', activityData);

        return activityData;
    } catch (error) {
        logger.error('Failed to log user activity', {
            error: error.message,
            activity
        });
    }
};

export const logSystemEvent = ({
    event,
    severity = 'INFO',
    metadata,
    errorMessage
}) => {
    try {
        const systemData = {
            event,
            severity,
            metadata: sanitizeData(metadata),
            errorMessage,
            timestamp: new Date().toISOString(),
            labels: {
                type: 'system',
                event,
                severity
            }
        };

        const logLevel = severity === 'ERROR' ? 'error' : severity === 'WARNING' ? 'warn' : 'info';
        logger[logLevel]('SYSTEM_EVENT', systemData);

        return systemData;
    } catch (error) {
        logger.error('Failed to log system event', {
            error: error.message,
            event
        });
    }
};

export const logPerformance = ({
    operation,
    duration,
    metadata
}) => {
    try {
        const performanceData = {
            operation,
            duration,
            metadata: sanitizeData(metadata),
            timestamp: new Date().toISOString(),
            labels: {
                type: 'performance',
                operation
            }
        };

        if (duration > 1000) {
            logger.warn('SLOW_OPERATION', performanceData);
        } else {
            logger.info('PERFORMANCE', performanceData);
        }

        return performanceData;
    } catch (error) {
        logger.error('Failed to log performance', {
            error: error.message,
            operation
        });
    }
};

export const AUDIT_ACTIONS = {
    USER_REGISTER: 'USER_REGISTER',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
    PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
    EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
    EMAIL_VERIFICATION_FAILED: 'EMAIL_VERIFICATION_FAILED',
    USER_CREATE: 'USER_CREATE',
    USER_UPDATE: 'USER_UPDATE',
    USER_DELETE: 'USER_DELETE',
    USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
    USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
    USER_SUSPEND: 'USER_SUSPEND',
    USER_UNSUSPEND: 'USER_UNSUSPEND',
    PRODUCT_CREATE: 'PRODUCT_CREATE',
    PRODUCT_UPDATE: 'PRODUCT_UPDATE',
    PRODUCT_DELETE: 'PRODUCT_DELETE',
    PRODUCT_STATUS_CHANGE: 'PRODUCT_STATUS_CHANGE',
    PRODUCT_STOCK_UPDATE: 'PRODUCT_STOCK_UPDATE',
    PRODUCT_IMAGE_UPLOAD: 'PRODUCT_IMAGE_UPLOAD',
    PRODUCT_IMAGE_DELETE: 'PRODUCT_IMAGE_DELETE',
    ORDER_CREATE: 'ORDER_CREATE',
    ORDER_UPDATE: 'ORDER_UPDATE',
    ORDER_STATUS_CHANGE: 'ORDER_STATUS_CHANGE',
    ORDER_CANCEL: 'ORDER_CANCEL',
    ORDER_REFUND_REQUEST: 'ORDER_REFUND_REQUEST',
    ORDER_REFUND_APPROVE: 'ORDER_REFUND_APPROVE',
    ORDER_REFUND_REJECT: 'ORDER_REFUND_REJECT',
    ORDER_TRACKING_UPDATE: 'ORDER_TRACKING_UPDATE',
    CART_ADD_ITEM: 'CART_ADD_ITEM',
    CART_UPDATE_ITEM: 'CART_UPDATE_ITEM',
    CART_REMOVE_ITEM: 'CART_REMOVE_ITEM',
    CART_CLEAR: 'CART_CLEAR',
    CATEGORY_CREATE: 'CATEGORY_CREATE',
    CATEGORY_UPDATE: 'CATEGORY_UPDATE',
    CATEGORY_DELETE: 'CATEGORY_DELETE',
    COUPON_CREATE: 'COUPON_CREATE',
    COUPON_UPDATE: 'COUPON_UPDATE',
    COUPON_DELETE: 'COUPON_DELETE',
    COUPON_USE: 'COUPON_USE',
    REVIEW_CREATE: 'REVIEW_CREATE',
    REVIEW_UPDATE: 'REVIEW_UPDATE',
    REVIEW_DELETE: 'REVIEW_DELETE',
    REVIEW_REPLY: 'REVIEW_REPLY',
    BANNER_CREATE: 'BANNER_CREATE',
    BANNER_UPDATE: 'BANNER_UPDATE',
    BANNER_DELETE: 'BANNER_DELETE',
    ATTENDANCE_MARK: 'ATTENDANCE_MARK',
    ATTENDANCE_UPDATE: 'ATTENDANCE_UPDATE',
    NOTIFICATION_CREATE: 'NOTIFICATION_CREATE',
    NOTIFICATION_SEND: 'NOTIFICATION_SEND',
    NOTIFICATION_DELETE: 'NOTIFICATION_DELETE',
    PAGE_CREATE: 'PAGE_CREATE',
    PAGE_UPDATE: 'PAGE_UPDATE',
    PAGE_DELETE: 'PAGE_DELETE',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    DATA_EXPORT: 'DATA_EXPORT',
    BULK_DELETE: 'BULK_DELETE',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    API_ERROR: 'API_ERROR'
};

export const AUDIT_RESOURCES = {
    USER: 'USER',
    PRODUCT: 'PRODUCT',
    ORDER: 'ORDER',
    CART: 'CART',
    CATEGORY: 'CATEGORY',
    COUPON: 'COUPON',
    REVIEW: 'REVIEW',
    BANNER: 'BANNER',
    ATTENDANCE: 'ATTENDANCE',
    NOTIFICATION: 'NOTIFICATION',
    PAGE: 'PAGE',
    AUTH: 'AUTH',
    SYSTEM: 'SYSTEM'
};
