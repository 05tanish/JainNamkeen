import { useState, useEffect, useRef } from 'react';

/**
 * Optimized image component with lazy loading and fade-in effect
 * Uses Intersection Observer API for performance
 */
export default function OptimizedImage({ 
    src, 
    alt, 
    className = '',
    style = {},
    placeholder = null,
    onLoad = null,
    onError = null,
    ...props 
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
        // Don't lazy load if image is already in viewport
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { 
                rootMargin: '50px', // Start loading 50px before image enters viewport
                threshold: 0.01
            }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, []);

    const handleLoad = (e) => {
        setIsLoaded(true);
        if (onLoad) onLoad(e);
    };

    const handleError = (e) => {
        setHasError(true);
        if (onError) onError(e);
    };

    return (
        <div 
            ref={imgRef} 
            className={`optimized-image-container ${className}`}
            style={{ 
                position: 'relative',
                overflow: 'hidden',
                ...style 
            }}
        >
            {/* Loading placeholder */}
            {!isLoaded && !hasError && (
                <div 
                    className="image-placeholder"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: placeholder || 'linear-gradient(90deg, var(--surface-container) 0%, var(--surface-container-high) 50%, var(--surface-container) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite'
                    }} 
                />
            )}

            {/* Error state */}
            {hasError && (
                <div 
                    className="image-error"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--surface-container)',
                        color: 'var(--on-surface-variant)',
                        fontSize: '0.875rem'
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🖼️</div>
                        <div>Image not available</div>
                    </div>
                </div>
            )}

            {/* Actual image - only load when in view */}
            {isInView && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    decoding="async"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                    {...props}
                />
            )}

            <style>{`
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
            `}</style>
        </div>
    );
}
