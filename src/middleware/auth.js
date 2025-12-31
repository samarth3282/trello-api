const TokenService = require('../utils/tokenService');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = TokenService.verifyAccessToken(token);

        // Get user
        const user = await User.findById(decoded.userId).active();

        if (!user) {
            throw new UnauthorizedError('User not found or inactive');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.message.includes('token')) {
            return ApiResponse.error(res, error.message, 401);
        }
        return ApiResponse.error(res, 'Authentication failed', 401);
    }
};

module.exports = authMiddleware;
