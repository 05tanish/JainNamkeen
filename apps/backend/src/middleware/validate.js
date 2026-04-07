/**
 * Reusable Zod validation middleware
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - Where to find the data in req (body, query, params). Default is 'body'.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
    try {
        const data = req[source];
        const validatedData = schema.parse(data);
        
        // Replace original request data with validated/transformed data
        if (source === 'body') {
            req.body = validatedData;
        } else {
            // Express 5 req.query and req.params are getters, so we must mutate instead of reassign
            Object.keys(req[source]).forEach(key => delete req[source][key]);
            Object.assign(req[source], validatedData);
        }
        
        next();
    } catch (error) {
        if (error.errors && Array.isArray(error.errors)) {
            // Zod error structure
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.errors.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        
        // Unexpected error
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

export default validate;
