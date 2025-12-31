const Project = require('../models/Project');
const { ForbiddenError, NotFoundError } = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');

const projectPermission = (requiredRole = 'member') => {
    return async (req, res, next) => {
        try {
            const projectId = req.params.projectId || req.body.projectId;

            if (!projectId) {
                throw new NotFoundError('Project ID not provided');
            }

            const project = await Project.findById(projectId).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Check if user is member
            if (!project.isMember(req.user._id)) {
                throw new ForbiddenError('You are not a member of this project');
            }

            // Check if user has required permission
            if (!project.hasPermission(req.user._id, requiredRole)) {
                throw new ForbiddenError(
                    `Insufficient permissions. Required role: ${requiredRole}`
                );
            }

            // Attach project to request
            req.project = project;
            next();
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return ApiResponse.error(res, error.message, statusCode);
        }
    };
};

module.exports = projectPermission;
