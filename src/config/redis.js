const Redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
    try {
        redisClient = Redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
            },
            password: process.env.REDIS_PASSWORD || undefined,
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis Client Connected');
        });

        redisClient.on('ready', () => {
            logger.info('Redis Client Ready');
        });

        redisClient.on('end', () => {
            logger.warn('Redis Client Disconnected');
        });

        await redisClient.connect();

        return redisClient;
    } catch (error) {
        logger.error(`Error connecting to Redis: ${error.message}`);
        // Don't exit - allow app to run without Redis (caching will be disabled)
        return null;
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
