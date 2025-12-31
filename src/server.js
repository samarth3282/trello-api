require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { configureCloudinary } = require('./config/cloudinary');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const SocketService = require('./sockets/socketService');
const logger = require('./utils/logger');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
});

// Make io available in request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    // Create a write stream (in append mode)
    const accessLogStream = fs.createWriteStream(
        path.join(logsDir, 'access.log'),
        { flags: 'a' }
    );
    app.use(morgan('combined', { stream: accessLogStream }));
}

// Rate limiting
app.use(generalLimiter);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// API Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Task & Team Management API',
        version: process.env.API_VERSION || 'v1',
        docs: '/api/v1/health',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Validate critical environment variables
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is required');
        }
        if (!process.env.JWT_ACCESS_SECRET) {
            throw new Error('JWT_ACCESS_SECRET environment variable is required');
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET environment variable is required');
        }

        logger.info('Starting server...');
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Port: ${PORT}`);

        // Connect to MongoDB
        logger.info('Connecting to MongoDB...');
        await connectDB();

        // Connect to Redis (optional - won't fail if not available)
        logger.info('Connecting to Redis...');
        await connectRedis();

        // Configure Cloudinary
        logger.info('Configuring Cloudinary...');
        configureCloudinary();

        // Start server
        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            logger.info(`✅ API endpoint: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
            logger.info(`✅ Health check: http://localhost:${PORT}/api/v1/health`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error.message);
        logger.error('Stack:', error.stack);

        // Provide helpful error messages
        if (error.message.includes('MONGO_URI')) {
            logger.error('💡 Please set MONGO_URI environment variable (MongoDB connection string)');
        }
        if (error.message.includes('JWT')) {
            logger.error('💡 Please set JWT secrets in environment variables');
        }
        if (error.message.includes('ECONNREFUSED')) {
            logger.error('💡 Cannot connect to MongoDB. Check your MONGO_URI and network access');
        }

        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

startServer();

module.exports = { app, server, io };
