const logger = require('../utils/logger');

class SocketService {
    constructor(io) {
        this.io = io;
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            // Join project room
            socket.on('join:project', (projectId) => {
                socket.join(`project:${projectId}`);
                logger.info(`Socket ${socket.id} joined project: ${projectId}`);
            });

            // Leave project room
            socket.on('leave:project', (projectId) => {
                socket.leave(`project:${projectId}`);
                logger.info(`Socket ${socket.id} left project: ${projectId}`);
            });

            // User is typing
            socket.on('typing:start', (data) => {
                socket.to(`project:${data.projectId}`).emit('user:typing', {
                    userId: data.userId,
                    userName: data.userName,
                    taskId: data.taskId,
                });
            });

            // User stopped typing
            socket.on('typing:stop', (data) => {
                socket.to(`project:${data.projectId}`).emit('user:stopped-typing', {
                    userId: data.userId,
                    taskId: data.taskId,
                });
            });

            // Task status changed (real-time board update)
            socket.on('task:status-changed', (data) => {
                socket.to(`project:${data.projectId}`).emit('task:updated', data.task);
            });

            // User joined project
            socket.on('user:joined', (data) => {
                this.io.to(`project:${data.projectId}`).emit('user:joined', {
                    user: data.user,
                    projectId: data.projectId,
                });
            });

            // Disconnect
            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });
    }

    // Emit task created event
    emitTaskCreated(projectId, task) {
        this.io.to(`project:${projectId}`).emit('task:created', task);
    }

    // Emit task updated event
    emitTaskUpdated(projectId, task) {
        this.io.to(`project:${projectId}`).emit('task:updated', task);
    }

    // Emit task deleted event
    emitTaskDeleted(projectId, taskId) {
        this.io.to(`project:${projectId}`).emit('task:deleted', { taskId });
    }

    // Emit comment added event
    emitCommentAdded(projectId, comment) {
        this.io.to(`project:${projectId}`).emit('comment:added', comment);
    }

    // Emit notification
    emitNotification(userId, notification) {
        this.io.to(`user:${userId}`).emit('notification', notification);
    }
}

module.exports = SocketService;
