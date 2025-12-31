const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'create',
                'update',
                'delete',
                'restore',
                'archive',
                'unarchive',
                'assign',
                'unassign',
                'comment',
                'invite',
                'join',
                'leave',
            ],
        },
        entity: {
            type: String,
            required: true,
            enum: ['user', 'project', 'board', 'task', 'comment'],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        entityName: {
            type: String,
            default: '',
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            default: null,
        },
        changes: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function (data) {
    try {
        await this.create(data);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Get activity description
activityLogSchema.virtual('description').get(function () {
    const actionText = {
        create: 'created',
        update: 'updated',
        delete: 'deleted',
        restore: 'restored',
        archive: 'archived',
        unarchive: 'unarchived',
        assign: 'assigned',
        unassign: 'unassigned',
        comment: 'commented on',
        invite: 'invited user to',
        join: 'joined',
        leave: 'left',
    };

    return `${actionText[this.action]} ${this.entity}${this.entityName ? ` "${this.entityName}"` : ''
        }`;
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
