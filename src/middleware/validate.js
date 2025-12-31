const Joi = require('joi');
const { ValidationError } = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            return ApiResponse.error(res, 'Validation Error', 422, errors);
        }

        next();
    };
};

module.exports = validate;
