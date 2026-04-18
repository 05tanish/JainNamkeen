import { ApiError } from '../utils/ApiError.js';

export const role = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
    }
    
    // Normalize roles to uppercase for comparison
    const normalizedRoles = roles.map(r => r.toUpperCase());
    const userRole = req.user.role?.toUpperCase();
    
    if (!normalizedRoles.includes(userRole)) {
        return next(
            new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`)
        );
    }
    next();
};

// Alias for consistency
export const requireRole = role;

