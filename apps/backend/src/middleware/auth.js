import crypto from 'crypto';
import { prisma } from '../config/Postgrsedb.js';
import { extractToken } from '../utils/TokenHelper.js';
import { verifyToken } from '../utils/JWT.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheGet, cacheSet, cacheDel } from '../config/Redis.js';

const USER_CACHE_TTL = 300; // 5 minutes
const USER_CACHE_PREFIX = 'user:';

// Helper to invalidate user cache (export for use in user update operations)
export const invalidateUserCache = async (userId) => {
    await cacheDel(`${USER_CACHE_PREFIX}${userId}`);
};

export const auth = asyncHandler(async (req, res, next) => {
    const token = extractToken(req);

    // Check token blacklist (handles logged-out tokens within their JWT validity window)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const isBlacklisted = await cacheGet(`bl:${tokenHash}`);
    if (isBlacklisted) throw new ApiError(401, 'Session invalidated. Please log in again.');

    const decoded = verifyToken(token);

    const cacheKey = `${USER_CACHE_PREFIX}${decoded.id}`;
    
    // Try to get user from cache first
    let user = await cacheGet(cacheKey);

    if (!user) {
        // Cache miss - fetch from database
        user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isSuspended: true,
                suspendReason: true,
                phone: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (user) {
            // Cache the user data for 5 minutes
            await cacheSet(cacheKey, user, USER_CACHE_TTL);
        }
    }

    if (!user) throw new ApiError(401, 'User no longer exists');
    if (!user.isActive) throw new ApiError(401, 'Your account has been deactivated. Contact support.');
    if (user.isSuspended) {
        throw new ApiError(
            403,
            `Your account has been suspended. Reason: ${user.suspendReason || 'No reason provided'}. Contact support.`
        );
    }

    req.user = user;
    next();
});
