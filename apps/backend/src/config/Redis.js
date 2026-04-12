import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;
let isConnected = false;

/**
 * Get the singleton Redis client.
 * Returns null if Redis is not connected (so the app degrades gracefully).
 */
export const getRedisClient = () => redisClient;

/**
 * Returns true only if Redis is currently connected.
 */
export const isRedisConnected = () => isConnected;

/**
 * Connect to Redis. Called once during app startup.
 * The app will continue running even if Redis is unavailable
 * (caching will simply be skipped).
 */
export const connectRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        logger.warn('Redis: max reconnect attempts reached, disabling Redis');
                        return false; // stop retrying
                    }
                    return Math.min(retries * 100, 3000); // exponential backoff up to 3s
                },
            },
        });

        redisClient.on('connect', () => {
            isConnected = true;
            logger.info('✅ Redis connected');
        });

        redisClient.on('error', (err) => {
            isConnected = false;
            logger.warn(`Redis error: ${err.message}`);
        });

        redisClient.on('end', () => {
            isConnected = false;
            logger.warn('Redis connection closed');
        });

        await redisClient.connect();
    } catch (err) {
        isConnected = false;
        logger.warn(`Redis unavailable: ${err.message} — caching disabled`);
    }
};

// ─── Cache helpers ────────────────────────────────────────────────────────────

/**
 * Get a parsed JSON value from Redis cache.
 * Returns null on cache miss or if Redis is offline.
 *
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export const cacheGet = async (key) => {
    if (!isConnected || !redisClient) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

/**
 * Store a value in Redis cache as JSON.
 * Silently fails if Redis is offline.
 *
 * @param {string} key
 * @param {*}      value
 * @param {number} [ttlSeconds=300]  Time-to-live in seconds (default 5 min)
 */
export const cacheSet = async (key, value, ttlSeconds = 300) => {
    if (!isConnected || !redisClient) return;
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch {
        // Swallow — cache is best-effort
    }
};

/**
 * Delete one or more keys from cache.
 *
 * @param {...string} keys
 */
export const cacheDel = async (...keys) => {
    if (!isConnected || !redisClient) return;
    try {
        await redisClient.del(keys);
    } catch {
        // Swallow
    }
};

export default redisClient;
