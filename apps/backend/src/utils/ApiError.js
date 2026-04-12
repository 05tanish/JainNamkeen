/**
 * Custom Application Error class.
 * Throw this anywhere in your service/controller layer and
 * the global errorMiddleware will format it into a consistent JSON response.
 *
 * Usage:
 *   throw new ApiError(404, 'User not found');
 *   throw new ApiError(400, 'Validation failed', ['name is required', 'email is invalid']);
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode  - HTTP status code (e.g. 400, 401, 404, 500)
     * @param {string} message     - Human-readable error message
     * @param {string[]} [errors]  - Optional array of validation/field-level errors
     * @param {string} [stack]     - Optional custom stack trace (rarely needed)
     */
    constructor(
        statusCode,
        message = 'Something went wrong',
        errors = [],
        stack = ''
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;