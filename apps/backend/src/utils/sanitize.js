/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
    if (typeof input !== 'string') return input;
    
    // Escape HTML special characters
    let sanitized = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    
    // Remove any script tags (double check)
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
};

/**
 * Recursively sanitize an object
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
export const sanitizeInput = (data) => {
    if (data === null || data === undefined) {
        return data;
    }
    
    if (typeof data === 'string') {
        return sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeInput(item));
    }
    
    if (typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return data;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeInput(req.body);
    }
    next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (req, res, next) => {
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeInput(req.query);
    }
    next();
};

/**
 * Middleware to sanitize all inputs
 * Note: req.query is read-only in Express, so we skip it
 */
export const sanitizeAll = (req, res, next) => {
    if (req.body) req.body = sanitizeInput(req.body);
    // Skip req.query as it's read-only in Express
    if (req.params) req.params = sanitizeInput(req.params);
    next();
};
