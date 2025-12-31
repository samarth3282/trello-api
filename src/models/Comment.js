const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            trim: true,
            minlength: [1, 'Comment cannot be empty'],
            maxlength: [2000, 'Comment cannot exceed 2000 characters'],
        },
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: [true, 'Comment must belong to a task'],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Comment must have an author'],
        },
        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        attachments: [
            {
                filename: String,
                url: String,
                fileType: String,
            },
        ],
        isEdited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
commentSchema.index({ task: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ mentions: 1 });
commentSchema.index({ deletedAt: 1 });

// Extract mentions from content before saving
commentSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        // Extract @mentions from content (format: @[userId])
        const mentionRegex = /@\[([a-f\d]{24})\]/gi;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(this.content)) !== null) {
            mentions.push(match[1]);
        }

        this.mentions = [...new Set(mentions)]; // Remove duplicates

        if (this.isModified('content') && !this.isNew) {
            this.isEdited = true;
            this.editedAt = new Date();
        }
    }
    next();
});

// Soft delete
commentSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
};

// Restore
commentSchema.methods.restore = function () {
    this.deletedAt = null;
    return this.save();
};

// Query helper
commentSchema.query.active = function () {
    return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Comment', commentSchema);
