const User = require('../models/User');
const TokenService = require('../utils/tokenService');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/errors');
const ActivityLog = require('../models/ActivityLog');

class AuthController {
    // Register new user
    static async register(req, res, next) {
        try {
            const { name, email, password, role } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new ConflictError('Email already registered');
            }

            // Create user
            const user = await User.create({
                name,
                email,
                password,
                role: role || 'member',
            });

            // Generate tokens
            const tokens = TokenService.generateTokenPair(user._id);

            // Save refresh token
            user.refreshTokens.push({
                token: tokens.refreshToken,
                createdAt: new Date(),
            });
            await user.save();

            // Log activity
            await ActivityLog.logActivity({
                user: user._id,
                action: 'create',
                entity: 'user',
                entityId: user._id,
                entityName: user.name,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });

            return ApiResponse.success(
                res,
                {
                    user,
                    ...tokens,
                },
                'User registered successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    }

    // Login user
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email }).select('+password').active();

            if (!user) {
                throw new UnauthorizedError('Invalid email or password');
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                throw new UnauthorizedError('Invalid email or password');
            }

            // Generate tokens
            const tokens = TokenService.generateTokenPair(user._id);

            // Save refresh token
            user.refreshTokens.push({
                token: tokens.refreshToken,
                createdAt: new Date(),
            });
            user.lastLogin = new Date();
            await user.save();

            // Remove password from response
            user.password = undefined;

            // Log activity
            await ActivityLog.logActivity({
                user: user._id,
                action: 'update',
                entity: 'user',
                entityId: user._id,
                entityName: 'login',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });

            return ApiResponse.success(res, {
                user,
                ...tokens,
            });
        } catch (error) {
            next(error);
        }
    }

    // Refresh token
    static async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new BadRequestError('Refresh token is required');
            }

            // Verify refresh token
            const decoded = TokenService.verifyRefreshToken(refreshToken);

            // Find user
            const user = await User.findById(decoded.userId).active();

            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            // Check if refresh token exists in database
            const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);

            if (!tokenExists) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            // Generate new tokens
            const tokens = TokenService.generateTokenPair(user._id);

            // Remove old refresh token and add new one
            user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
            user.refreshTokens.push({
                token: tokens.refreshToken,
                createdAt: new Date(),
            });
            await user.save();

            return ApiResponse.success(res, tokens);
        } catch (error) {
            next(error);
        }
    }

    // Logout
    static async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (refreshToken) {
                const user = await User.findById(req.user._id);
                user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
                await user.save();
            }

            return ApiResponse.success(res, null, 'Logged out successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get current user
    static async getMe(req, res, next) {
        try {
            const user = await User.findById(req.user._id);
            return ApiResponse.success(res, user);
        } catch (error) {
            next(error);
        }
    }

    // Update profile
    static async updateProfile(req, res, next) {
        try {
            const { name, bio, avatar } = req.body;

            const user = await User.findById(req.user._id);

            if (name) user.name = name;
            if (bio !== undefined) user.bio = bio;
            if (avatar !== undefined) user.avatar = avatar;

            await user.save();

            // Log activity
            await ActivityLog.logActivity({
                user: user._id,
                action: 'update',
                entity: 'user',
                entityId: user._id,
                entityName: user.name,
                changes: { name, bio, avatar },
            });

            return ApiResponse.success(res, user, 'Profile updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // Change password
    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            const user = await User.findById(req.user._id).select('+password');

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);

            if (!isPasswordValid) {
                throw new BadRequestError('Current password is incorrect');
            }

            // Update password
            user.password = newPassword;
            user.refreshTokens = []; // Clear all refresh tokens
            await user.save();

            return ApiResponse.success(res, null, 'Password changed successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
