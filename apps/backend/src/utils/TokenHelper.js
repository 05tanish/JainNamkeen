import { ApiError } from './ApiError.js';
import { getCookieOptions } from './JWT.js';
import { successResponse } from './ApiResponse.js';

export const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        if (token) return token;
    }

    if (req.cookies?.token) {
        return req.cookies.token;
    }

    throw new ApiError(401, 'No authentication token provided. Please log in.');
};

export const sendTokenResponse = (res, user, token, statusCode = 200, message = 'Success') => {
    res.cookie('token', token, getCookieOptions());
    return successResponse(res, {
        statusCode,
        message,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone ?? '',
            address: user.address ?? {},
            isActive: user.isActive,
        }
    });
};
