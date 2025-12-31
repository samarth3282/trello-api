const { getRedisClient } = require('../config/redis');
const logger = require('./logger');

class CacheService {
    // Get cached data
    static async get(key) {
        try {
            const redis = getRedisClient();
            if (!redis) return null;

            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    // Set cached data with expiration (in seconds)
    static async set(key, value, expireSeconds = 300) {
        try {
            const redis = getRedisClient();
            if (!redis) return false;

            await redis.setEx(key, expireSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    // Delete cached data
    static async delete(key) {
        try {
            const redis = getRedisClient();
            if (!redis) return false;

            await redis.del(key);
            return true;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    // Delete multiple keys by pattern
    static async deletePattern(pattern) {
        try {
            const redis = getRedisClient();
            if (!redis) return false;

            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(keys);
            }
            return true;
        } catch (error) {
            logger.error(`Cache delete pattern error for ${pattern}:`, error);
            return false;
        }
    }

    // Clear all cache
    static async clear() {
        try {
            const redis = getRedisClient();
            if (!redis) return false;

            await redis.flushAll();
            return true;
        } catch (error) {
            logger.error('Cache clear error:', error);
            return false;
        }
    }

    // Generate cache key
    static generateKey(prefix, ...parts) {
        return `${prefix}:${parts.join(':')}`;
    }
}

module.exports = CacheService;
