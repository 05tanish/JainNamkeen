import jwt from 'jsonwebtoken';
import { ApiError } from './ApiError.js';

const parseDurationMs = (duration) => {
    if (!duration) return 7 * 24 * 60 * 60 * 1000;
    const num = parseInt(duration, 10);
    if (duration.endsWith('d')) return num * 24 * 60 * 60 * 1000;
    if (duration.endsWith('h')) return num * 60 * 60 * 1000;
    if (duration.endsWith('m')) return num * 60 * 1000;
    if (duration.endsWith('s')) return num * 1000;
    return num * 1000;
};

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

export const getCookieOptions = () => {
    const expiresMs = parseDurationMs(process.env.JWT_EXPIRE);
    const isProd = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        expires: new Date(Date.now() + expiresMs),
        path: '/',
    };
};
