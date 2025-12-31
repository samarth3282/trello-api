const Joi = require('joi');

const taskValidators = {
    create: Joi.object({
        title: Joi.string().min(3).max(200).required().messages({
            'string.empty': 'Task title is required',
            'string.min': 'Task title must be at least 3 characters long',
            'string.max': 'Task title cannot exceed 200 characters',
        }),
        description: Joi.string().max(5000).optional().allow(''),
        status: Joi.string()
            .valid('todo', 'in-progress', 'review', 'done')
            .optional(),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'urgent')
            .optional(),
        assignedTo: Joi.string().hex().length(24).optional().allow(null),
        dueDate: Joi.date().optional().allow(null),
        estimatedHours: Joi.number().min(0).optional().allow(null),
        tags: Joi.array().items(Joi.string()).optional(),
    }),

    update: Joi.object({
        title: Joi.string().min(3).max(200).optional(),
        description: Joi.string().max(5000).optional().allow(''),
        status: Joi.string()
            .valid('todo', 'in-progress', 'review', 'done')
            .optional(),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'urgent')
            .optional(),
        assignedTo: Joi.string().hex().length(24).optional().allow(null),
        dueDate: Joi.date().optional().allow(null),
        estimatedHours: Joi.number().min(0).optional().allow(null),
        actualHours: Joi.number().min(0).optional().allow(null),
        tags: Joi.array().items(Joi.string()).optional(),
        order: Joi.number().optional(),
        isArchived: Joi.boolean().optional(),
    }),
};

const boardValidators = {
    create: Joi.object({
        name: Joi.string().min(2).max(100).required().messages({
            'string.empty': 'Board name is required',
            'string.min': 'Board name must be at least 2 characters long',
            'string.max': 'Board name cannot exceed 100 characters',
        }),
        description: Joi.string().max(500).optional().allow(''),
        color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
    }),

    update: Joi.object({
        name: Joi.string().min(2).max(100).optional(),
        description: Joi.string().max(500).optional().allow(''),
        color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
        order: Joi.number().optional(),
        isArchived: Joi.boolean().optional(),
    }),
};

const commentValidators = {
    create: Joi.object({
        content: Joi.string().min(1).max(2000).required().messages({
            'string.empty': 'Comment content is required',
            'string.max': 'Comment cannot exceed 2000 characters',
        }),
    }),

    update: Joi.object({
        content: Joi.string().min(1).max(2000).required().messages({
            'string.empty': 'Comment content is required',
            'string.max': 'Comment cannot exceed 2000 characters',
        }),
    }),
};

module.exports = {
    taskValidators,
    boardValidators,
    commentValidators,
};
