const { ForbiddenError } = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new ForbiddenError('User not authenticated');
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new ForbiddenError(
                    `Access denied. Required roles: ${allowedRoles.join(', ')}`
                );
            }

            next();
        } catch (error) {
            return ApiResponse.error(res, error.message, 403);
        }
    };
};

module.exports = roleMiddleware;
