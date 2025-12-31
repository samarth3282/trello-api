const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });

    // Convert non-ApiError to ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        error = new ApiError(400, 'Validation Error', errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = new ApiError(409, `${field} already exists`);
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        error = new ApiError(400, 'Invalid ID format');
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, 'Token expired');
    }

    // Send response
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.errors && { errors: error.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
