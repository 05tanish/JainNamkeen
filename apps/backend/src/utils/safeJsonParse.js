/**
 * Safely parse JSON string
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed JSON or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return defaultValue;
    }
};

/**
 * Get first image from images array/JSON
 * @param {string|Array} images - Images data (JSON string or array)
 * @returns {string|null} First image URL or null
 */
export const getFirstImage = (images) => {
    if (!images) return null;
    
    // If it's already an array
    if (Array.isArray(images)) {
        return images.length > 0 ? images[0] : null;
    }
    
    // If it's a JSON string
    if (typeof images === 'string') {
        const parsed = safeJsonParse(images, []);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    }
    
    return null;
};

/**
 * Parse JSON field safely
 * @param {string|Array|Object} field - Field to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed value or default
 */
export const parseJsonField = (field, defaultValue = []) => {
    if (!field) return defaultValue;
    
    // Already parsed
    if (typeof field === 'object') return field;
    
    // Parse string
    if (typeof field === 'string') {
        return safeJsonParse(field, defaultValue);
    }
    
    return defaultValue;
};
