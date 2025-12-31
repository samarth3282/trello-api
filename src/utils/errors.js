class ApiError extends Error {
    constructor(statusCode, message, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends ApiError {
    constructor(message = 'Bad Request', errors = null) {
        super(400, message, errors);
    }
}

class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

class ConflictError extends ApiError {
    constructor(message = 'Resource already exists') {
        super(409, message);
    }
}

class ValidationError extends ApiError {
    constructor(errors) {
        super(422, 'Validation Error', errors);
    }
}

class InternalServerError extends ApiError {
    constructor(message = 'Internal Server Error') {
        super(500, message);
    }
}

module.exports = {
    ApiError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    InternalServerError,
};
