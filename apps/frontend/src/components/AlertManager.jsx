import { createContext, useContext, useState } from 'react';
import { Alert } from '@heroui/react';

/**
 * AlertContext - Provides alert management functionality throughout the app
 */
const AlertContext = createContext();

/**
 * useAlert Hook - Access alert functionality from any component
 * @returns {Object} { showAlert: Function }
 */
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

/**
 * AlertProvider Component - Manages alert state and rendering
 * 
 * Features:
 * - Fixed positioning (top-right)
 * - Auto-dismiss after configurable duration (default 3s)
 * - Support for multiple alert types: success, error, info, warning
 * - Slide-in animation
 * - Multiple alerts stacking
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  /**
   * Show an alert message
   * @param {string} message - Alert message to display
   * @param {string} type - Alert type: 'success' | 'error' | 'info' | 'warning'
   * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
   */
  const showAlert = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random(); // Ensure unique ID
    setAlerts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        dismissAlert(id);
      }, duration);
    }
  };

  /**
   * Dismiss a specific alert
   * @param {number} id - Alert ID to dismiss
   */
  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '400px',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            type={alert.type}
            onClose={() => dismissAlert(alert.id)}
            closable
            style={{ animation: 'slideInRight 0.3s ease' }}
          >
            {alert.message}
          </Alert>
        ))}
      </div>
    </AlertContext.Provider>
  );
};
