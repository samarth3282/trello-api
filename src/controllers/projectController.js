const Project = require('../models/Project');
const Board = require('../models/Board');
const User = require('../models/User');
const TokenService = require('../utils/tokenService');
const ApiResponse = require('../utils/apiResponse');
const CacheService = require('../utils/cacheService');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const emailService = require('../services/emailService');

class ProjectController {
    // Get all projects for current user
    static async getProjects(req, res, next) {
        try {
            const { page = 1, limit = 10, search, isArchived } = req.query;
            const skip = (page - 1) * limit;

            // Build query
            const query = {
                'members.user': req.user._id,
                deletedAt: null,
            };

            if (search) {
                query.$text = { $search: search };
            }

            if (isArchived !== undefined) {
                query.isArchived = isArchived === 'true';
            }

            // Check cache
            const cacheKey = CacheService.generateKey(
                'projects',
                req.user._id.toString(),
                page,
                limit,
                search || '',
                isArchived || ''
            );
            const cached = await CacheService.get(cacheKey);

            if (cached) {
                return ApiResponse.paginated(res, cached.projects, cached.pagination);
            }

            // Query database
            const projects = await Project.find(query)
                .populate('owner', 'name email avatar')
                .populate('members.user', 'name email avatar')
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Project.countDocuments(query);

            // Cache results
            await CacheService.set(
                cacheKey,
                { projects, pagination: { page: parseInt(page), limit: parseInt(limit), total } },
                300
            );

            return ApiResponse.paginated(res, projects, {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get project by ID
    static async getProject(req, res, next) {
        try {
            const project = await Project.findById(req.params.id)
                .active()
                .populate('owner', 'name email avatar')
                .populate('members.user', 'name email avatar');

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Check if user is member
            if (!project.isMember(req.user._id)) {
                throw new ForbiddenError('You are not a member of this project');
            }

            // Get boards for this project
            const boards = await Board.find({ project: project._id, deletedAt: null })
                .sort('order')
                .select('name description order isArchived');

            return ApiResponse.success(res, { ...project.toObject(), boards });
        } catch (error) {
            next(error);
        }
    }

    // Create project
    static async createProject(req, res, next) {
        try {
            const { name, description, members, color } = req.body;

            const project = await Project.create({
                name,
                description,
                owner: req.user._id,
                members: members || [],
                color,
            });

            await project.populate('owner', 'name email avatar');
            await project.populate('members.user', 'name email avatar');

            // Clear cache
            await CacheService.deletePattern(`projects:${req.user._id}*`);

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'create',
                entity: 'project',
                entityId: project._id,
                entityName: project.name,
                project: project._id,
            });

            return ApiResponse.success(res, project, 'Project created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    // Update project
    static async updateProject(req, res, next) {
        try {
            const { name, description, color, isArchived } = req.body;

            const project = await Project.findById(req.params.id).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Check permission
            if (!project.hasPermission(req.user._id, 'manager')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            const changes = {};
            if (name !== undefined) {
                changes.name = { old: project.name, new: name };
                project.name = name;
            }
            if (description !== undefined) {
                changes.description = { old: project.description, new: description };
                project.description = description;
            }
            if (color !== undefined) {
                changes.color = { old: project.color, new: color };
                project.color = color;
            }
            if (isArchived !== undefined) {
                changes.isArchived = { old: project.isArchived, new: isArchived };
                project.isArchived = isArchived;
            }

            await project.save();
            await project.populate('owner', 'name email avatar');
            await project.populate('members.user', 'name email avatar');

            // Clear cache
            await CacheService.deletePattern('projects:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: isArchived ? 'archive' : 'update',
                entity: 'project',
                entityId: project._id,
                entityName: project.name,
                project: project._id,
                changes,
            });

            return ApiResponse.success(res, project, 'Project updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // Delete project (soft delete)
    static async deleteProject(req, res, next) {
        try {
            const project = await Project.findById(req.params.id).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Only owner or admin can delete
            if (
                project.owner.toString() !== req.user._id.toString() &&
                req.user.role !== 'admin'
            ) {
                throw new ForbiddenError('Only project owner or admin can delete project');
            }

            await project.softDelete();

            // Clear cache
            await CacheService.deletePattern('projects:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'delete',
                entity: 'project',
                entityId: project._id,
                entityName: project.name,
                project: project._id,
            });

            return ApiResponse.success(res, null, 'Project deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // Invite user to project
    static async inviteUser(req, res, next) {
        try {
            const { email, role } = req.body;
            const projectId = req.params.id;

            const project = await Project.findById(projectId).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Check permission
            if (!project.hasPermission(req.user._id, 'manager')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            // Check if user exists
            const invitedUser = await User.findOne({ email }).active();

            if (!invitedUser) {
                throw new NotFoundError('User not found with this email');
            }

            // Check if already member
            if (project.isMember(invitedUser._id)) {
                throw new BadRequestError('User is already a member of this project');
            }

            // Generate invite token
            const inviteToken = TokenService.generateInviteToken(projectId, email, role);

            // Send invitation email
            await emailService.sendProjectInvite(email, {
                projectName: project.name,
                inviterName: req.user.name,
                inviteToken,
                role,
            });

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'invite',
                entity: 'project',
                entityId: project._id,
                entityName: project.name,
                project: project._id,
                changes: { invitedEmail: email, role },
            });

            return ApiResponse.success(
                res,
                { inviteToken },
                'Invitation sent successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    // Accept invitation
    static async acceptInvite(req, res, next) {
        try {
            const { token } = req.params;

            // Verify token
            const decoded = TokenService.verifyInviteToken(token);
            const { projectId, email, role } = decoded;

            // Check if current user email matches
            if (req.user.email !== email) {
                throw new BadRequestError('This invitation is for a different email');
            }

            const project = await Project.findById(projectId).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Check if already member
            if (project.isMember(req.user._id)) {
                throw new BadRequestError('You are already a member of this project');
            }

            // Add user to project
            project.members.push({
                user: req.user._id,
                role,
                joinedAt: new Date(),
            });

            await project.save();

            // Clear cache
            await CacheService.deletePattern('projects:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'join',
                entity: 'project',
                entityId: project._id,
                entityName: project.name,
                project: project._id,
            });

            return ApiResponse.success(res, project, 'Successfully joined project');
        } catch (error) {
            next(error);
        }
    }

    // Remove member from project
    static async removeMember(req, res, next) {
        try {
            const { memberId } = req.params;
            const projectId = req.params.id;

            const project = await Project.findById(projectId).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Check permission
            if (!project.hasPermission(req.user._id, 'manager')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            // Cannot remove owner
            if (project.owner.toString() === memberId) {
                throw new BadRequestError('Cannot remove project owner');
            }

            // Remove member
            project.members = project.members.filter(
                (m) => m.user.toString() !== memberId
            );

            await project.save();

            // Clear cache
            await CacheService.deletePattern('projects:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'update',
                entity: 'project',
                entityId: project._id,
                entityName: project.name,
                project: project._id,
                changes: { removedMember: memberId },
            });

            return ApiResponse.success(res, project, 'Member removed successfully');
        } catch (error) {
            next(error);
        }
    }

    // Update member role
    static async updateMemberRole(req, res, next) {
        try {
            const { memberId } = req.params;
            const { role } = req.body;
            const projectId = req.params.id;

            const project = await Project.findById(projectId).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            // Only owner or admin can change roles
            if (
                project.owner.toString() !== req.user._id.toString() &&
                req.user.role !== 'admin'
            ) {
                throw new ForbiddenError('Only project owner or admin can change member roles');
            }

            // Find and update member
            const member = project.members.find(
                (m) => m.user.toString() === memberId
            );

            if (!member) {
                throw new NotFoundError('Member not found in project');
            }

            const oldRole = member.role;
            member.role = role;

            await project.save();

            // Clear cache
            await CacheService.deletePattern('projects:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'update',
                entity: 'project',
                entityId: project._id,
                entityName: project.name,
                project: project._id,
                changes: { memberRole: { userId: memberId, old: oldRole, new: role } },
            });

            return ApiResponse.success(res, project, 'Member role updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ProjectController;
