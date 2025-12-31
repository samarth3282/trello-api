const Redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
    try {
        // Skip Redis if not configured
        if (!process.env.REDIS_HOST || process.env.REDIS_HOST === 'localhost') {
            logger.info('⚠️  Redis not configured - caching disabled');
            return null;
        }

        // Remove port from host if accidentally included
        const host = process.env.REDIS_HOST.split(':')[0];
        const port = parseInt(process.env.REDIS_PORT) || 6379;

        logger.info(`Connecting to Redis: ${host}:${port}`);

        redisClient = Redis.createClient({
            socket: {
                host,
                port,
            },
            password: process.env.REDIS_PASSWORD || undefined,
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('✅ Redis Client Connected');
        });

        redisClient.on('ready', () => {
            logger.info('✅ Redis Client Ready');
        });

        redisClient.on('end', () => {
            logger.warn('⚠️  Redis Client Disconnected');
        });

        await redisClient.connect();

        return redisClient;
    } catch (error) {
        logger.error(`❌ Error connecting to Redis: ${error.message}`);
        logger.info('Continuing without Redis - caching disabled');
        // Don't exit - allow app to run without Redis (caching will be disabled)
        return null;
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
