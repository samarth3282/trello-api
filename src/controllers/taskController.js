const Task = require('../models/Task');
const Board = require('../models/Board');
const Project = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');
const CacheService = require('../utils/cacheService');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class TaskController {
    // Get all tasks with filters
    static async getTasks(req, res, next) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                priority,
                assignedTo,
                search,
                boardId,
                dueDate,
                tags,
            } = req.query;

            const skip = (page - 1) * limit;

            // Build query
            const query = { deletedAt: null };

            if (boardId) {
                // Verify user has access to board
                const board = await Board.findById(boardId).populate('project');
                if (!board || !board.project.isMember(req.user._id)) {
                    throw new ForbiddenError('Access denied');
                }
                query.board = boardId;
            }

            if (status) query.status = status;
            if (priority) query.priority = priority;
            if (assignedTo) query.assignedTo = assignedTo;
            if (search) query.$text = { $search: search };
            if (tags) query.tags = { $in: tags.split(',') };

            if (dueDate) {
                const date = new Date(dueDate);
                query.dueDate = {
                    $gte: new Date(date.setHours(0, 0, 0, 0)),
                    $lt: new Date(date.setHours(23, 59, 59, 999)),
                };
            }

            const tasks = await Task.find(query)
                .populate('assignedTo', 'name email avatar')
                .populate('createdBy', 'name email avatar')
                .populate('board', 'name')
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Task.countDocuments(query);

            return ApiResponse.paginated(res, tasks, {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get task by ID
    static async getTask(req, res, next) {
        try {
            const task = await Task.findById(req.params.id)
                .active()
                .populate('assignedTo', 'name email avatar')
                .populate('createdBy', 'name email avatar')
                .populate('board')
                .populate({
                    path: 'comments',
                    match: { deletedAt: null },
                    populate: { path: 'author', select: 'name email avatar' },
                });

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            // Check access
            const board = await Board.findById(task.board._id).populate('project');
            if (!board.project.isMember(req.user._id)) {
                throw new ForbiddenError('Access denied');
            }

            return ApiResponse.success(res, task);
        } catch (error) {
            next(error);
        }
    }

    // Create task
    static async createTask(req, res, next) {
        try {
            const { boardId } = req.params;
            const taskData = req.body;

            const board = await Board.findById(boardId).active().populate('project');

            if (!board) {
                throw new NotFoundError('Board not found');
            }

            // Check permission
            if (!board.project.hasPermission(req.user._id, 'member')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            const task = await Task.create({
                ...taskData,
                board: boardId,
                createdBy: req.user._id,
            });

            await task.populate('assignedTo', 'name email avatar');
            await task.populate('createdBy', 'name email avatar');

            // Clear cache
            await CacheService.deletePattern('tasks:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'create',
                entity: 'task',
                entityId: task._id,
                entityName: task.title,
                project: board.project._id,
            });

            // Emit socket event
            req.io?.to(`project:${board.project._id}`).emit('task:created', task);

            return ApiResponse.success(res, task, 'Task created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    // Update task
    static async updateTask(req, res, next) {
        try {
            const task = await Task.findById(req.params.id).active();

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            const board = await Board.findById(task.board).populate('project');

            // Check permission
            if (!board.project.hasPermission(req.user._id, 'member')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            const changes = {};
            const allowedFields = [
                'title',
                'description',
                'status',
                'priority',
                'assignedTo',
                'dueDate',
                'estimatedHours',
                'actualHours',
                'tags',
                'order',
                'isArchived',
            ];

            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    changes[field] = { old: task[field], new: req.body[field] };
                    task[field] = req.body[field];
                }
            });

            await task.save();
            await task.populate('assignedTo', 'name email avatar');
            await task.populate('createdBy', 'name email avatar');

            // Clear cache
            await CacheService.deletePattern('tasks:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'update',
                entity: 'task',
                entityId: task._id,
                entityName: task.title,
                project: board.project._id,
                changes,
            });

            // Emit socket event
            req.io?.to(`project:${board.project._id}`).emit('task:updated', task);

            return ApiResponse.success(res, task, 'Task updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // Delete task
    static async deleteTask(req, res, next) {
        try {
            const task = await Task.findById(req.params.id).active();

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            const board = await Board.findById(task.board).populate('project');

            // Check permission
            if (!board.project.hasPermission(req.user._id, 'manager')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            await task.softDelete();

            // Clear cache
            await CacheService.deletePattern('tasks:*');

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'delete',
                entity: 'task',
                entityId: task._id,
                entityName: task.title,
                project: board.project._id,
            });

            // Emit socket event
            req.io?.to(`project:${board.project._id}`).emit('task:deleted', { taskId: task._id });

            return ApiResponse.success(res, null, 'Task deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // Add attachment
    static async addAttachment(req, res, next) {
        try {
            const task = await Task.findById(req.params.id).active();

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            const { filename, url, fileType, fileSize } = req.body;

            task.attachments.push({
                filename,
                url,
                fileType,
                fileSize,
                uploadedBy: req.user._id,
                uploadedAt: new Date(),
            });

            await task.save();

            return ApiResponse.success(res, task, 'Attachment added successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TaskController;
