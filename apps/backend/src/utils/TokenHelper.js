import ApiError from './ApiError.js';
import { getCookieOptions } from './JWT.js';
import { successResponse } from './ApiResponse.js';

/**
 * Extract the JWT from an incoming request.
 * Priority: Authorization header (Bearer) → cookie named 'token'
 *
 * @param {import('express').Request} req
 * @returns {string} Raw token string
 * @throws {ApiError} 401 if no token found
 */
export const extractToken = (req) => {
    // 1. Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        if (token) return token;
    }

    // 2. Cookie
    if (req.cookies?.token) {
        return req.cookies.token;
    }

    throw new ApiError(401, 'No authentication token provided. Please log in.');
};

/**
 * Set a JWT cookie and return the standardised success body.
 * Response shape: { success, message, data: { _id, name, email, role, phone, address } }
 *
 * @param {import('express').Response} res
 * @param {Object} user        Mongoose User document
 * @param {string} token       Pre-generated JWT string
 * @param {number} statusCode  200 | 201
 * @param {string} message     Human-readable success message
 */
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
