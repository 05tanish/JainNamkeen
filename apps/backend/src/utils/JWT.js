import jwt from 'jsonwebtoken';
import ApiError from './ApiError.js';

/**
 * Parse a duration string like '7d', '24h', '3600' into milliseconds.
 * Used to calculate cookie expiry from JWT_EXPIRE env var.
 */
const parseDurationMs = (duration) => {
    if (!duration) return 7 * 24 * 60 * 60 * 1000; // default 7 days
    const num = parseInt(duration, 10);
    if (duration.endsWith('d')) return num * 24 * 60 * 60 * 1000;
    if (duration.endsWith('h')) return num * 60 * 60 * 1000;
    if (duration.endsWith('m')) return num * 60 * 1000;
    if (duration.endsWith('s')) return num * 1000;
    // Pure number → treat as seconds
    return num * 1000;
};

/**
 * Generate a signed JWT token.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string} Signed JWT
 */
export const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new ApiError(500, 'Server misconfiguration: JWT_SECRET is not set');
    }
    return jwt.sign(
        { id: userId.toString() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * Verify and decode a JWT token.
 *
 * @param {string} token
 * @returns {{ id: string, iat: number, exp: number }} Decoded payload
 * @throws {ApiError} 401 on invalid or expired token
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Session expired — please log in again');
        }
        throw new ApiError(401, 'Invalid authentication token');
    }
};

/**
 * Build Express cookie options respecting JWT_EXPIRE, NODE_ENV, and FRONTEND_URL.
 * Aligns cookie lifetime with the JWT expiry so they expire together.
 *
 * @returns {import('express').CookieOptions}
 */
export const getCookieOptions = () => {
    const expiresMs = parseDurationMs(process.env.JWT_EXPIRE);
    const isProd = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,                              // XSS protection
        secure: isProd,                              // HTTPS only in prod
        sameSite: isProd ? 'none' : 'lax',           // 'none' needed for cross-origin cookies
        expires: new Date(Date.now() + expiresMs),   // matches JWT expiry
        path: '/',
    };
};
