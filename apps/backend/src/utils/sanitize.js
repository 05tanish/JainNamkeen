/**
 * Sanitize string input to prevent XSS attacks.
 *
 * WHY: We escape HTML characters so that if a string ever gets rendered
 * inside HTML (e.g. in an email template or a server-side rendered page),
 * it cannot inject malicious tags.
 *
 * WHY NOT '/'?: Escaping '/' to '&#x2F;' broke ISO date strings like
 * "2026-04-21T00:00:00.000Z" and URL paths stored in request bodies.
 * The '/' character is NOT dangerous in HTML context — only '<', '>', '"',
 * "'", and '&' are. SQL injection is already prevented by Prisma's
 * parameterized queries, so we don't need to escape '/' here.
 *
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
    if (typeof input !== 'string') return input;

    // Escape only the 5 characters that are dangerous in HTML context.
    // Order matters: '&' must be first so we don't double-escape later replacements.
    return input
        .replace(/&/g, '&amp;')   // & → &amp;  (must be first)
        .replace(/</g, '&lt;')    // < → &lt;   (closes open tags)
        .replace(/>/g, '&gt;')    // > → &gt;   (closes open tags)
        .replace(/"/g, '&quot;')  // " → &quot; (breaks out of attributes)
        .replace(/'/g, '&#x27;')  // ' → &#x27; (breaks out of attributes)
        .trim();
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
 * Middleware to sanitize all inputs — body, query params, and route params.
 *
 * NOTE: req.query IS mutable in Express despite common misconceptions.
 * Express parses the query string into a plain object assigned to req.query,
 * which can be freely reassigned. Skipping it would expose search, filter,
 * and pagination endpoints to XSS if values are ever echoed back to the user.
 */
export const sanitizeAll = (req, res, next) => {
    if (req.body) req.body = sanitizeInput(req.body);
    if (req.query && typeof req.query === 'object') {
        // Reassign sanitized values key-by-key to preserve the object reference
        // (some middleware may hold a reference to req.query)
        const sanitized = sanitizeInput(req.query);
        for (const key of Object.keys(req.query)) delete req.query[key];
        Object.assign(req.query, sanitized);
    }
    if (req.params) req.params = sanitizeInput(req.params);
    next();
};
