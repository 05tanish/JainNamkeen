import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

let redisClient = null;
let isConnected = false;

export const getRedisClient = () => redisClient;

export const isRedisConnected = () => isConnected;

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
                    return Math.min(retries * 100, 3000);
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

export const cacheGet = async (key) => {
    if (!isConnected || !redisClient) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        logger.warn(`Cache parse error for key ${key}: ${err.message}`);
        return null;
    }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
    if (!isConnected || !redisClient) return;
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch {
    }
};

export const cacheDel = async (...keys) => {
    if (!isConnected || !redisClient) return;
    try {
        await redisClient.del(keys);
    } catch {
    }
};
