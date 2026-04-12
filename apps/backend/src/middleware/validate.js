import ApiError from '../utils/ApiError.js';

/**
 * Zod schema validation middleware.
 * Validates req[source] against the provided Zod schema.
 * On failure, passes a formatted ApiError to next() so the
 * global errorMiddleware handles the response consistently.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        const errors = result.error.errors.map(err => ({
            path: err.path.join('.') || source,
            message: err.message,
        }));
        return next(new ApiError(400, 'Validation failed', errors));
    }

    // Replace the source data with the validated + coerced data
    if (source === 'body') {
        req.body = result.data;
    } else {
        // Express 5: req.query and req.params are frozen getters — mutate in place
        Object.keys(req[source]).forEach(key => delete req[source][key]);
        Object.assign(req[source], result.data);
    }

    next();
};

export default validate;
