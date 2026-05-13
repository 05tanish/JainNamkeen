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
                    // Allow more retries with exponential backoff
                    if (retries > 20) {
                        logger.error('Redis: max reconnect attempts (20) reached');
                        return false; // stop retrying
                    }
                    // Exponential backoff: 500ms, 1s, 2s, 4s, 8s, ... max 30s
                    const delay = Math.min(Math.pow(2, retries) * 500, 30000);
                    logger.info(`Redis reconnect attempt ${retries}, waiting ${delay}ms`);
                    return delay;
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
    } catch (err) {
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
