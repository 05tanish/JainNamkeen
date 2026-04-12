import ApiError from '../utils/ApiError.js';

/**
 * Role-based access control middleware.
 * Must be used AFTER the `auth` middleware so that `req.user` is set.
 *
 * Usage:
 *   router.delete('/:id', auth, role('admin'), deleteHandler);
 *   router.put('/status', auth, role('admin', 'staff'), updateStatus);
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'staff', 'user')
 */
export const role = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
        return next(
            new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`)
        );
    }
    next();
};

export default role;
