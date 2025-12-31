const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: ['admin', 'manager', 'member'],
            default: 'member',
        },
        avatar: {
            type: String,
            default: null,
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            default: '',
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        refreshTokens: [
            {
                token: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        lastLogin: {
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
// Note: email index is created automatically by 'unique: true'
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ deletedAt: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshTokens;
    delete user.__v;
    return user;
};

// Soft delete
userSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    this.isActive = false;
    return this.save();
};

// Restore soft deleted
userSchema.methods.restore = function () {
    this.deletedAt = null;
    this.isActive = true;
    return this.save();
};

// Query helper to exclude soft deleted
userSchema.query.active = function () {
    return this.where({ deletedAt: null });
};

module.exports = mongoose.model('User', userSchema);
