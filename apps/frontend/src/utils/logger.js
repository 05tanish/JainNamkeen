// Safe logging utility for frontend

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Sanitize error objects to remove sensitive data
const sanitizeError = (error) => {
    if (!error) return null;
    
    // Create safe error object
    const safeError = {
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        status: error.response?.status,
        statusText: error.response?.statusText
    };
    
    // In development, include more details
    if (isDevelopment) {
        safeError.stack = error.stack;
        safeError.config = error.config ? {
            method: error.config.method,
            url: error.config.url
        } : null;
    }
    
    return safeError;
};

export const logger = {
    error: (message, error = null) => {
        if (isDevelopment) {
            console.error(`[ERROR] ${message}`, error);
        } else if (isProduction) {
            // In production, only log sanitized message
            console.error(`[ERROR] ${message}`);
            
            // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
            // if (window.Sentry) {
            //     window.Sentry.captureException(error, {
            //         extra: { message }
            //     });
            // }
        }
    },
    
    warn: (message, data = null) => {
        if (isDevelopment) {
            console.warn(`[WARN] ${message}`, data);
        }
        // Don't log warnings in production
    },
    
    info: (message, data = null) => {
        if (isDevelopment) {
            console.log(`[INFO] ${message}`, data);
        }
        // Don't log info in production
    },
    
    debug: (message, data = null) => {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, data);
        }
        // Never log debug in production
    },

    // Log API errors safely
    apiError: (message, error) => {
        const safeError = sanitizeError(error);
        
        if (isDevelopment) {
            console.error(`[API ERROR] ${message}`, {
                error: safeError,
                fullError: error
            });
        } else {
            console.error(`[API ERROR] ${message}`);
            
            // TODO: Send to error tracking
            // if (window.Sentry) {
            //     window.Sentry.captureException(error, {
            //         tags: { type: 'api_error' },
            //         extra: { message, safeError }
            //     });
            // }
        }
    },

    // Log user actions for analytics
    userAction: (action, data = {}) => {
        if (isDevelopment) {
            console.log(`[USER ACTION] ${action}`, data);
        }
        
        // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
        // if (window.gtag) {
        //     window.gtag('event', action, data);
        // }
    }
};

// Export for use in error boundaries
export const logErrorToService = (error, errorInfo) => {
    const safeError = sanitizeError(error);
    
    if (isProduction) {
        // TODO: Send to error tracking service
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, {
        //         extra: {
        //             errorInfo,
        //             safeError
        //         }
        //     });
        // }
    }
    
    logger.error('React Error Boundary caught error', { error: safeError, errorInfo });
};
