const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            minlength: [3, 'Project name must be at least 3 characters long'],
            maxlength: [100, 'Project name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
            default: '',
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Project must have an owner'],
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['admin', 'manager', 'member'],
                    default: 'member',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        isArchived: {
            type: Boolean,
            default: false,
        },
        color: {
            type: String,
            default: '#3498db',
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
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ name: 'text', description: 'text' });
projectSchema.index({ deletedAt: 1 });
projectSchema.index({ isArchived: 1 });

// Virtual for boards
projectSchema.virtual('boards', {
    ref: 'Board',
    localField: '_id',
    foreignField: 'project',
});

// Ensure owner is also in members array
projectSchema.pre('save', function (next) {
    if (this.isNew) {
        const ownerInMembers = this.members.some(
            (member) => member.user.toString() === this.owner.toString()
        );

        if (!ownerInMembers) {
            this.members.unshift({
                user: this.owner,
                role: 'admin',
                joinedAt: new Date(),
            });
        }
    }
    next();
});

// Soft delete
projectSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
};

// Restore
projectSchema.methods.restore = function () {
    this.deletedAt = null;
    return this.save();
};

// Query helper
projectSchema.query.active = function () {
    return this.where({ deletedAt: null });
};

// Check if user is member
projectSchema.methods.isMember = function (userId) {
    return this.members.some(
        (member) => member.user.toString() === userId.toString()
    );
};

// Get user role in project
projectSchema.methods.getUserRole = function (userId) {
    const member = this.members.find(
        (member) => member.user.toString() === userId.toString()
    );
    return member ? member.role : null;
};

// Check if user has permission
projectSchema.methods.hasPermission = function (userId, requiredRole) {
    const roleHierarchy = { admin: 3, manager: 2, member: 1 };
    const userRole = this.getUserRole(userId);

    if (!userRole) return false;

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

module.exports = mongoose.model('Project', projectSchema);
