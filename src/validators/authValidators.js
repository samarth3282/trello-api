const Joi = require('joi');

const authValidators = {
    register: Joi.object({
        name: Joi.string().min(2).max(50).required().messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
        }),
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email',
        }),
        password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base':
                    'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            }),
        role: Joi.string().valid('admin', 'manager', 'member').optional(),
    }),

    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email',
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Password is required',
        }),
    }),

    refreshToken: Joi.object({
        refreshToken: Joi.string().required().messages({
            'string.empty': 'Refresh token is required',
        }),
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string().required().messages({
            'string.empty': 'Current password is required',
        }),
        newPassword: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.empty': 'New password is required',
                'string.min': 'New password must be at least 8 characters long',
                'string.pattern.base':
                    'New password must contain at least one uppercase letter, one lowercase letter, and one number',
            }),
    }),
};

module.exports = authValidators;
