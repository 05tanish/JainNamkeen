import { createTheme } from '@heroui/react';

/**
 * HeroUI Theme Configuration for Jain Namkeen
 * 
 * This theme configuration matches the brand's warm brown aesthetic
 * and integrates with the existing design system defined in index.css
 */
export const heroUITheme = createTheme({
  colors: {
    // Primary brand colors
    primary: '#b8651b',           // Warm brown - main brand color
    primaryDark: '#8b4513',       // Dark brown - hover states
    primaryLight: '#d4a574',      // Light brown - subtle highlights
    
    // Secondary colors
    secondary: '#2c1810',         // Deep brown - text and accents
    
    // Utility colors
    success: '#10b981',           // Green - success states
    error: '#ef4444',             // Red - error states
    warning: '#f59e0b',           // Orange - warning states
    info: '#3b82f6',              // Blue - info states
    
    // Surface colors
    background: '#fff8f3',        // Light cream background
    surface: '#ffffff',           // White surface
    surfaceContainer: '#f5f1eb',  // Container background
    
    // Text colors
    text: '#2c1810',              // Primary text (dark brown)
    textSecondary: '#6b5d54',     // Secondary text (muted brown)
    textMuted: '#8b7a6a',         // Muted text
  },
  
  fonts: {
    heading: '"Libre Baskerville", serif',
    body: '"Inter", sans-serif',
  },
  
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '24px',
  },
  
  shadows: {
    sm: '0 2px 8px rgba(44, 24, 16, 0.08)',
    md: '0 4px 16px rgba(44, 24, 16, 0.12)',
    lg: '0 8px 24px rgba(44, 24, 16, 0.16)',
  },
});
