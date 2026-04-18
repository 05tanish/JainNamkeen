// Frontend validation utilities

export const validators = {
    email: (value) => {
        if (!value) return 'Email is required';
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value) ? null : 'Invalid email format';
    },
    
    phone: (value) => {
        if (!value) return 'Phone number is required';
        const regex = /^[6-9]\d{9}$/;  // Indian phone number
        return regex.test(value) ? null : 'Invalid phone number (must be 10 digits starting with 6-9)';
    },
    
    pincode: (value) => {
        if (!value) return 'Pincode is required';
        const regex = /^\d{6}$/;  // Indian pincode
        return regex.test(value) ? null : 'Invalid pincode (must be 6 digits)';
    },
    
    required: (value, fieldName = 'This field') => {
        return value && value.toString().trim() ? null : `${fieldName} is required`;
    },

    minLength: (value, min, fieldName = 'This field') => {
        if (!value) return `${fieldName} is required`;
        return value.length >= min ? null : `${fieldName} must be at least ${min} characters`;
    },

    maxLength: (value, max, fieldName = 'This field') => {
        if (!value) return null;
        return value.length <= max ? null : `${fieldName} must be at most ${max} characters`;
    },

    password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain at least one special character';
        return null;
    },

    confirmPassword: (password, confirmPassword) => {
        if (!confirmPassword) return 'Please confirm your password';
        return password === confirmPassword ? null : 'Passwords do not match';
    },

    number: (value, fieldName = 'This field') => {
        if (!value) return `${fieldName} is required`;
        return !isNaN(value) && Number(value) > 0 ? null : `${fieldName} must be a positive number`;
    },

    url: (value) => {
        if (!value) return null; // Optional
        try {
            new URL(value);
            return null;
        } catch {
            return 'Invalid URL format';
        }
    }
};

// Validate entire form
export const validateForm = (formData, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
        const value = formData[field];
        const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
        
        for (const rule of fieldRules) {
            const error = rule(value);
            if (error) {
                errors[field] = error;
                break; // Stop at first error for this field
            }
        }
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Sanitize input (basic XSS prevention)
export const sanitizeInput = (value) => {
    if (typeof value !== 'string') return value;
    
    return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
