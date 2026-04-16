import User from '../modules/users/user.model.js';
import { extractToken } from '../utils/TokenHelper.js';
import { verifyToken } from '../utils/JWT.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const auth = asyncHandler(async (req, res, next) => {
    const token = extractToken(req);
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('+isSuspended +suspendReason');
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
