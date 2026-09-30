"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            status: err.statusCode,
        });
        return;
    }
    const parserError = err;
    if (parserError.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Request body must contain valid JSON.', status: 400 });
        return;
    }
    if (parserError.type === 'entity.too.large') {
        res.status(413).json({ error: 'Request body exceeds the 1 MB limit.', status: 413 });
        return;
    }
    console.error('Unexpected error:', err.message);
    res.status(500).json({
        error: 'An unexpected error occurred. Please try again.',
        status: 500,
    });
}
