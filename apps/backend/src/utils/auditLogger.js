import mongoose from 'mongoose';
import logger from './logger.js';

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Some actions might not have a user (e.g., failed login attempts)
    },
    userEmail: {
        type: String,
        required: false
    },
    action: {
        type: String,
        required: true,
        enum: [
            // Auth actions
            'USER_REGISTER', 'USER_LOGIN', 'USER_LOGOUT', 'USER_LOGIN_FAILED',
            'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE',
            'EMAIL_VERIFICATION', 'EMAIL_VERIFICATION_FAILED',

            // User management
            'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ROLE_CHANGE',
            'USER_STATUS_CHANGE', 'USER_SUSPEND', 'USER_UNSUSPEND',

            // Product actions
            'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_STATUS_CHANGE',
            'PRODUCT_STOCK_UPDATE', 'PRODUCT_IMAGE_UPLOAD', 'PRODUCT_IMAGE_DELETE',

            // Order actions
            'ORDER_CREATE', 'ORDER_UPDATE', 'ORDER_STATUS_CHANGE', 'ORDER_CANCEL',
            'ORDER_REFUND_REQUEST', 'ORDER_REFUND_APPROVE', 'ORDER_REFUND_REJECT',
            'ORDER_TRACKING_UPDATE',

            // Cart actions
            'CART_ADD_ITEM', 'CART_UPDATE_ITEM', 'CART_REMOVE_ITEM', 'CART_CLEAR',

            // Category actions
            'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',

            // Coupon actions
            'COUPON_CREATE', 'COUPON_UPDATE', 'COUPON_DELETE', 'COUPON_USE',

            // Review actions
            'REVIEW_CREATE', 'REVIEW_UPDATE', 'REVIEW_DELETE', 'REVIEW_REPLY',

            // Banner actions
            'BANNER_CREATE', 'BANNER_UPDATE', 'BANNER_DELETE',

            // Attendance actions
            'ATTENDANCE_MARK', 'ATTENDANCE_UPDATE',

            // Notification actions
            'NOTIFICATION_CREATE', 'NOTIFICATION_SEND', 'NOTIFICATION_DELETE',

            // Page actions
            'PAGE_CREATE', 'PAGE_UPDATE', 'PAGE_DELETE',

            // Security events
            'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_EXCEEDED', 'INVALID_TOKEN',
            'SUSPICIOUS_ACTIVITY', 'DATA_EXPORT', 'BULK_DELETE',

            // System events
            'SYSTEM_ERROR', 'DATABASE_ERROR', 'API_ERROR'
        ]
    },
    resource: {
        type: String,
        required: true,
        enum: [
            'USER', 'PRODUCT', 'ORDER', 'CART', 'CATEGORY', 'COUPON',
            'REVIEW', 'BANNER', 'ATTENDANCE', 'NOTIFICATION', 'PAGE',
            'AUTH', 'SYSTEM'
        ]
    },
    resourceId: {
        type: String, // Can be ObjectId or other identifier
        required: false
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        required: false
    },
    endpoint: {
        type: String,
        required: false
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    changes: {
        type: mongoose.Schema.Types.Mixed, // Store before/after values
        required: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // Additional context
        required: false
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'WARNING'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String,
        required: false
    },
    duration: {
        type: Number, // Request duration in ms
        required: false
    }
}, {
    timestamps: true,
    // Automatically create indexes
    autoIndex: true
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

// TTL index — auto-delete logs after AUDIT_LOG_TTL_DAYS (default 90 days)
// Set AUDIT_LOG_TTL_DAYS=0 in .env to disable TTL
const ttlDays = parseInt(process.env.AUDIT_LOG_TTL_DAYS ?? '90', 10);
if (ttlDays > 0) {
    auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlDays * 86400 });
}

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Create an audit log entry
 */
/** Fields that must never be stored in audit logs (security). */
const SENSITIVE_FIELDS = new Set(['password', 'token', 'secret', 'authorization', 'creditCard', 'cvv']);

/** Strip sensitive keys from an object before persisting. */
const sanitizeChanges = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    return Object.fromEntries(
        Object.entries(obj).filter(([k]) => !SENSITIVE_FIELDS.has(k.toLowerCase()))
    );
};

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
        const auditLog = await AuditLog.create({
            userId,
            userEmail,
            action,
            resource,
            resourceId,
            method,
            endpoint,
            ipAddress,
            userAgent,
            changes: sanitizeChanges(changes),
            metadata,
            status,
            errorMessage,
            duration
        });

        // Also log to Winston for immediate visibility
        logger.info('Audit log created', {
            auditId: auditLog._id,
            action,
            resource,
            userId,
            status
        });

        return auditLog;
    } catch (error) {
        // Don't throw - audit logging should never break the main flow
        logger.error('Failed to create audit log', {
            error: error.message,
            action,
            resource
        });
    }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters = {}, options = {}) => {
    try {
        const {
            userId,
            action,
            resource,
            resourceId,
            status,
            startDate,
            endDate,
            ipAddress
        } = filters;

        const {
            page = 1,
            limit = 50,
            sort = '-createdAt'
        } = options;

        const query = {};

        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (resource) query.resource = resource;
        if (resourceId) query.resourceId = resourceId;
        if (status) query.status = status;
        if (ipAddress) query.ipAddress = ipAddress;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return {
            logs,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    } catch (error) {
        logger.error('Failed to get audit logs', { error: error.message });
        throw error;
    }
};

/**
 * Get audit logs for a specific user
 */
export const getUserAuditLogs = async (userId, options = {}) => {
    return getAuditLogs({ userId }, options);
};

/**
 * Get audit logs for a specific resource
 */
export const getResourceAuditLogs = async (resource, resourceId, options = {}) => {
    return getAuditLogs({ resource, resourceId }, options);
};

/**
 * Get security-related audit logs
 */
export const getSecurityAuditLogs = async (options = {}) => {
    const securityActions = [
        'USER_LOGIN_FAILED',
        'UNAUTHORIZED_ACCESS',
        'RATE_LIMIT_EXCEEDED',
        'INVALID_TOKEN',
        'SUSPICIOUS_ACTIVITY'
    ];

    try {
        const { page = 1, limit = 50, startDate, endDate } = options;

        const query = {
            action: { $in: securityActions }
        };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return {
            logs,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    } catch (error) {
        logger.error('Failed to get security audit logs', { error: error.message });
        throw error;
    }
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (startDate, endDate) => {
    try {
        const query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const [
            totalLogs,
            actionStats,
            resourceStats,
            statusStats,
            topUsers
        ] = await Promise.all([
            AuditLog.countDocuments(query),

            AuditLog.aggregate([
                { $match: query },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            AuditLog.aggregate([
                { $match: query },
                { $group: { _id: '$resource', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            AuditLog.aggregate([
                { $match: query },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            AuditLog.aggregate([
                { $match: { ...query, userId: { $ne: null } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        userId: '$_id',
                        count: 1,
                        name: '$user.name',
                        email: '$user.email'
                    }
                }
            ])
        ]);

        return {
            totalLogs,
            actionStats,
            resourceStats,
            statusStats,
            topUsers
        };
    } catch (error) {
        logger.error('Failed to get audit stats', { error: error.message });
        throw error;
    }
};

/**
 * Delete old audit logs (for maintenance)
 */
export const deleteOldAuditLogs = async (daysToKeep = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await AuditLog.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        logger.info('Old audit logs deleted', {
            deletedCount: result.deletedCount,
            cutoffDate
        });

        return result;
    } catch (error) {
        logger.error('Failed to delete old audit logs', { error: error.message });
        throw error;
    }
};

export default {
    createAuditLog,
    getAuditLogs,
    getUserAuditLogs,
    getResourceAuditLogs,
    getSecurityAuditLogs,
    getAuditStats,
    deleteOldAuditLogs,
    AuditLog
};
