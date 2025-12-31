const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Board name is required'],
            trim: true,
            minlength: [2, 'Board name must be at least 2 characters long'],
            maxlength: [100, 'Board name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Board must belong to a project'],
        },
        order: {
            type: Number,
            default: 0,
        },
        color: {
            type: String,
            default: '#95a5a6',
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

// Indexes
boardSchema.index({ project: 1, order: 1 });
boardSchema.index({ deletedAt: 1 });
boardSchema.index({ isArchived: 1 });
boardSchema.index({ name: 'text', description: 'text' });

// Virtual for tasks
boardSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'board',
});

// Auto-increment order on creation
boardSchema.pre('save', async function (next) {
    if (this.isNew && this.order === 0) {
        const Board = this.constructor;
        const lastBoard = await Board.findOne({ project: this.project })
            .sort('-order')
            .select('order');

        this.order = lastBoard ? lastBoard.order + 1 : 1;
    }
    next();
});

// Soft delete
boardSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
};

// Restore
boardSchema.methods.restore = function () {
    this.deletedAt = null;
    return this.save();
};

// Query helper
boardSchema.query.active = function () {
    return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Board', boardSchema);
