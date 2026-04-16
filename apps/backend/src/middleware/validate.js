import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        const errors = result.error.errors.map(err => ({
            path: err.path.join('.') || source,
            message: err.message,
        }));
        return next(new ApiError(400, 'Validation failed', errors));
    }

    if (source === 'body') {
        req.body = result.data;
    } else {
        Object.keys(req[source]).forEach(key => delete req[source][key]);
        Object.assign(req[source], result.data);
    }

    next();
};
