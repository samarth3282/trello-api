const Board = require('../models/Board');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiResponse = require('../utils/apiResponse');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class BoardController {
    // Get boards for a project
    static async getBoards(req, res, next) {
        try {
            const { projectId } = req.params;

            const project = await Project.findById(projectId).active();

            if (!project || !project.isMember(req.user._id)) {
                throw new ForbiddenError('Access denied');
            }

            const boards = await Board.find({ project: projectId, deletedAt: null })
                .sort('order')
                .populate('project', 'name');

            return ApiResponse.success(res, boards);
        } catch (error) {
            next(error);
        }
    }

    // Get board by ID with tasks
    static async getBoard(req, res, next) {
        try {
            const board = await Board.findById(req.params.id)
                .active()
                .populate('project', 'name description');

            if (!board) {
                throw new NotFoundError('Board not found');
            }

            const project = await Project.findById(board.project._id);
            if (!project.isMember(req.user._id)) {
                throw new ForbiddenError('Access denied');
            }

            // Get tasks for this board
            const tasks = await Task.find({ board: board._id, deletedAt: null })
                .populate('assignedTo', 'name email avatar')
                .populate('createdBy', 'name email avatar')
                .sort('order');

            return ApiResponse.success(res, { ...board.toObject(), tasks });
        } catch (error) {
            next(error);
        }
    }

    // Create board
    static async createBoard(req, res, next) {
        try {
            const { projectId } = req.params;
            const { name, description, color } = req.body;

            const project = await Project.findById(projectId).active();

            if (!project) {
                throw new NotFoundError('Project not found');
            }

            if (!project.hasPermission(req.user._id, 'manager')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            const board = await Board.create({
                name,
                description,
                project: projectId,
                color,
            });

            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'create',
                entity: 'board',
                entityId: board._id,
                entityName: board.name,
                project: projectId,
            });

            return ApiResponse.success(res, board, 'Board created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    // Update board
    static async updateBoard(req, res, next) {
        try {
            const board = await Board.findById(req.params.id).active();

            if (!board) {
                throw new NotFoundError('Board not found');
            }

            const project = await Project.findById(board.project);
            if (!project.hasPermission(req.user._id, 'manager')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            const { name, description, color, order, isArchived } = req.body;

            if (name) board.name = name;
            if (description !== undefined) board.description = description;
            if (color) board.color = color;
            if (order !== undefined) board.order = order;
            if (isArchived !== undefined) board.isArchived = isArchived;

            await board.save();

            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'update',
                entity: 'board',
                entityId: board._id,
                entityName: board.name,
                project: board.project,
            });

            return ApiResponse.success(res, board, 'Board updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // Delete board
    static async deleteBoard(req, res, next) {
        try {
            const board = await Board.findById(req.params.id).active();

            if (!board) {
                throw new NotFoundError('Board not found');
            }

            const project = await Project.findById(board.project);
            if (!project.hasPermission(req.user._id, 'manager')) {
                throw new ForbiddenError('Insufficient permissions');
            }

            await board.softDelete();

            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'delete',
                entity: 'board',
                entityId: board._id,
                entityName: board.name,
                project: board.project,
            });

            return ApiResponse.success(res, null, 'Board deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BoardController;
