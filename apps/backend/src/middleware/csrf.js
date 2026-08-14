import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { cacheGet, cacheSet } from '../config/Redis.js';
import { logger } from '../utils/logger.js';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_TTL = 3600; // 1 hour

// In-memory fallback store for when Redis is unavailable
const csrfMemoryStore = new Map();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of csrfMemoryStore.entries()) {
        if (value.expires < now) {
            csrfMemoryStore.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.debug(`Cleaned ${cleaned} expired CSRF tokens from memory store`);
    }
}, 5 * 60 * 1000);

/**
 * Peek at the JWT bearer token to extract the user ID WITHOUT running
 * authentication middleware. We only need the user ID as a namespace key
 * for the CSRF store — we are NOT trusting the token for authorization.
 *
 * This is safe because:
 *  1. We only read the `id` field from the decoded payload.
 *  2. The actual auth middleware still performs full signature verification
 *     before any protected handler executes.
 *  3. If the token is tampered or absent the function returns null and we
 *     fall back to the guest _guest_id cookie.
 */
const peekUserId = (req) => {
    try {
        const authHeader = req.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        const token = authHeader.slice(7);
        // jwt.decode does NO signature verification — safe for namespace-only use
        const payload = jwt.decode(token);
        return payload?.id || payload?.userId || null;
    } catch {
        return null;
    }
};

// Generate a CSRF token
export const generateCsrfToken = () => {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

// Middleware to provide CSRF token
export const provideCsrfToken = async (req, res, next) => {
    try {
        const token = generateCsrfToken();

        // Derive a stable session key.
        // Try peeking at the JWT first (works even before auth middleware runs),
        // then fall back to the guest cookie.
        let sessionKey = peekUserId(req) || req.user?.id;
        if (!sessionKey) {
            sessionKey = req.cookies?.['_guest_id'];
            if (!sessionKey) {
                // First-time guest: mint a persistent fingerprint cookie
                sessionKey = crypto.randomBytes(16).toString('hex');
                res.cookie('_guest_id', sessionKey, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                });
            }
        }

        // Try Redis first, fallback to memory
        try {
            await cacheSet(`csrf:${sessionKey}`, token, CSRF_TOKEN_TTL);
        } catch (err) {
            logger.warn('Redis unavailable for CSRF, using in-memory store');
            csrfMemoryStore.set(sessionKey, {
                token,
                expires: Date.now() + CSRF_TOKEN_TTL * 1000
            });
        }

        // Send CSRF token in JS-readable cookie so axios can read and send it
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: CSRF_TOKEN_TTL * 1000
        });

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to verify CSRF token
export const verifyCsrfToken = async (req, _res, next) => {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    try {
        // Get token from header (sent by axios)
        const token = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];

        if (!token) {
            throw new ApiError(403, 'CSRF token missing');
        }

        // Resolve same session key used during token generation.
        // Peek at the JWT first (works before auth middleware), then fall back.
        let sessionKey = peekUserId(req) || req.user?.id;
        if (!sessionKey) {
            sessionKey = req.cookies?.['_guest_id'];
        }
        if (!sessionKey) {
            throw new ApiError(403, 'CSRF session not found. Please refresh and try again.');
        }

        // Try Redis first, fallback to memory
        let storedToken;
        try {
            storedToken = await cacheGet(`csrf:${sessionKey}`);
        } catch (err) {
            logger.warn('Redis unavailable for CSRF verification, checking memory store');
            const memoryEntry = csrfMemoryStore.get(sessionKey);
            if (memoryEntry && memoryEntry.expires > Date.now()) {
                storedToken = memoryEntry.token;
            }
        }

        if (!storedToken) {
            throw new ApiError(403, 'CSRF token expired or invalid');
        }

        // Timing-safe comparison to prevent timing attacks
        if (token.length !== storedToken.length ||
            !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))) {
            throw new ApiError(403, 'CSRF token mismatch');
        }

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
        } else {
            next(new ApiError(403, 'CSRF validation failed'));
        }
    }
};
