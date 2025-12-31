const Joi = require('joi');

const projectValidators = {
    create: Joi.object({
        name: Joi.string().min(3).max(100).required().messages({
            'string.empty': 'Project name is required',
            'string.min': 'Project name must be at least 3 characters long',
            'string.max': 'Project name cannot exceed 100 characters',
        }),
        description: Joi.string().max(1000).optional().allow(''),
        color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
        members: Joi.array()
            .items(
                Joi.object({
                    user: Joi.string().hex().length(24).required(),
                    role: Joi.string().valid('admin', 'manager', 'member').required(),
                })
            )
            .optional(),
    }),

    update: Joi.object({
        name: Joi.string().min(3).max(100).optional(),
        description: Joi.string().max(1000).optional().allow(''),
        color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
        isArchived: Joi.boolean().optional(),
    }),

    invite: Joi.object({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email',
        }),
        role: Joi.string()
            .valid('admin', 'manager', 'member')
            .required()
            .messages({
                'string.empty': 'Role is required',
                'any.only': 'Role must be admin, manager, or member',
            }),
    }),

    updateMember: Joi.object({
        role: Joi.string().valid('admin', 'manager', 'member').required(),
    }),
};

module.exports = projectValidators;
