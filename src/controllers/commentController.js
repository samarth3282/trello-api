const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Board = require('../models/Board');
const ApiResponse = require('../utils/apiResponse');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class CommentController {
    // Get comments for a task
    static async getComments(req, res, next) {
        try {
            const { taskId } = req.params;

            const task = await Task.findById(taskId).active().populate({
                path: 'board',
                populate: 'project',
            });

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            if (!task.board.project.isMember(req.user._id)) {
                throw new ForbiddenError('Access denied');
            }

            const comments = await Comment.find({ task: taskId, deletedAt: null })
                .populate('author', 'name email avatar')
                .populate('mentions', 'name email')
                .sort('createdAt');

            return ApiResponse.success(res, comments);
        } catch (error) {
            next(error);
        }
    }

    // Create comment
    static async createComment(req, res, next) {
        try {
            const { taskId } = req.params;
            const { content } = req.body;

            const task = await Task.findById(taskId).active().populate({
                path: 'board',
                populate: 'project',
            });

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            if (!task.board.project.isMember(req.user._id)) {
                throw new ForbiddenError('Access denied');
            }

            const comment = await Comment.create({
                content,
                task: taskId,
                author: req.user._id,
            });

            await comment.populate('author', 'name email avatar');
            await comment.populate('mentions', 'name email');

            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'comment',
                entity: 'task',
                entityId: taskId,
                entityName: task.title,
                project: task.board.project._id,
            });

            // Emit socket event
            req.io?.to(`project:${task.board.project._id}`).emit('comment:added', comment);

            return ApiResponse.success(res, comment, 'Comment added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    // Update comment
    static async updateComment(req, res, next) {
        try {
            const { content } = req.body;

            const comment = await Comment.findById(req.params.id).active();

            if (!comment) {
                throw new NotFoundError('Comment not found');
            }

            if (comment.author.toString() !== req.user._id.toString()) {
                throw new ForbiddenError('You can only edit your own comments');
            }

            comment.content = content;
            await comment.save();

            await comment.populate('author', 'name email avatar');

            return ApiResponse.success(res, comment, 'Comment updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // Delete comment
    static async deleteComment(req, res, next) {
        try {
            const comment = await Comment.findById(req.params.id).active();

            if (!comment) {
                throw new NotFoundError('Comment not found');
            }

            if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                throw new ForbiddenError('You can only delete your own comments');
            }

            await comment.softDelete();

            return ApiResponse.success(res, null, 'Comment deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CommentController;
