const Queue = require('bull');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Create job queues
const emailQueue = new Queue('email', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    },
});

const notificationQueue = new Queue('notification', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    },
});

// Email queue processor
emailQueue.process(async (job) => {
    const { type, to, data } = job.data;
    logger.info(`Processing email job: ${type} to ${to}`);

    try {
        switch (type) {
            case 'welcome':
                await emailService.sendWelcomeEmail(to, data);
                break;
            case 'project-invite':
                await emailService.sendProjectInvite(to, data);
                break;
            case 'task-assignment':
                await emailService.sendTaskAssignment(to, data);
                break;
            case 'mention':
                await emailService.sendMentionNotification(to, data);
                break;
            case 'daily-digest':
                await emailService.sendDailyDigest(to, data);
                break;
            default:
                logger.warn(`Unknown email type: ${type}`);
        }
    } catch (error) {
        logger.error(`Email job failed: ${error.message}`);
        throw error;
    }
});

// Notification queue processor
notificationQueue.process(async (job) => {
    const { type, userId, data } = job.data;
    logger.info(`Processing notification job: ${type} for user ${userId}`);

    // Here you would implement notification logic
    // e.g., creating in-app notifications, push notifications, etc.
    try {
        // Placeholder for notification logic
        logger.info(`Notification sent: ${type}`);
    } catch (error) {
        logger.error(`Notification job failed: ${error.message}`);
        throw error;
    }
});

// Daily digest job (scheduled)
const sendDailyDigests = async () => {
    try {
        const users = await User.find({ isActive: true });

        for (const user of users) {
            // Get user's tasks
            const assignedTasks = await Task.find({
                assignedTo: user._id,
                status: { $in: ['todo', 'in-progress'] },
                deletedAt: null,
            }).limit(10);

            // Get recent activities
            const activities = await ActivityLog.find({ user: user._id })
                .sort('-createdAt')
                .limit(10)
                .populate('user', 'name');

            // Queue digest email
            await emailQueue.add({
                type: 'daily-digest',
                to: user.email,
                data: {
                    assignedTasks,
                    activities,
                },
            });
        }

        logger.info('Daily digests queued successfully');
    } catch (error) {
        logger.error(`Daily digest job failed: ${error.message}`);
    }
};

// Job queue event listeners
emailQueue.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
    logger.error(`Email job ${job.id} failed: ${err.message}`);
});

notificationQueue.on('completed', (job) => {
    logger.info(`Notification job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
    logger.error(`Notification job ${job.id} failed: ${err.message}`);
});

module.exports = {
    emailQueue,
    notificationQueue,
    sendDailyDigests,
};
