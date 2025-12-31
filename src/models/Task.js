const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            minlength: [3, 'Task title must be at least 3 characters long'],
            maxlength: [200, 'Task title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
            default: '',
        },
        board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: [true, 'Task must belong to a board'],
        },
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'review', 'done'],
            default: 'todo',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Task must have a creator'],
        },
        dueDate: {
            type: Date,
            default: null,
        },
        estimatedHours: {
            type: Number,
            min: [0, 'Estimated hours cannot be negative'],
            default: null,
        },
        actualHours: {
            type: Number,
            min: [0, 'Actual hours cannot be negative'],
            default: null,
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        attachments: [
            {
                filename: String,
                url: String,
                fileType: String,
                fileSize: Number,
                uploadedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        order: {
            type: Number,
            default: 0,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for performance
taskSchema.index({ board: 1, status: 1, order: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ deletedAt: 1 });

// Virtual for comments
taskSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'task',
});

// Auto-increment order on creation
taskSchema.pre('save', async function (next) {
    if (this.isNew && this.order === 0) {
        const Task = this.constructor;
        const lastTask = await Task.findOne({ board: this.board })
            .sort('-order')
            .select('order');

        this.order = lastTask ? lastTask.order + 1 : 1;
    }
    next();
});

// Soft delete
taskSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
};

// Restore
taskSchema.methods.restore = function () {
    this.deletedAt = null;
    return this.save();
};

// Query helper
taskSchema.query.active = function () {
    return this.where({ deletedAt: null });
};

// Check if overdue
taskSchema.virtual('isOverdue').get(function () {
    if (!this.dueDate || this.status === 'done') return false;
    return new Date() > this.dueDate;
});

module.exports = mongoose.model('Task', taskSchema);
