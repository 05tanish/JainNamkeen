import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { AlertProvider, useAlert } from './AlertManager';

// Mock HeroUI Alert component
vi.mock('@heroui/react', () => ({
  Alert: ({ children, type, onClose, closable, style }) => (
    <div 
      data-testid="alert" 
      data-type={type}
      style={style}
    >
      {children}
      {closable && (
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
      )}
    </div>
  ),
}));

// Test component that uses the alert hook
const TestComponent = () => {
  const { showAlert } = useAlert();
  
  return (
    <div>
      <button onClick={() => showAlert('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showAlert('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showAlert('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => showAlert('Warning message', 'warning')}>
        Show Warning
      </button>
      <button onClick={() => showAlert('No dismiss', 'info', 0)}>
        Show No Dismiss
      </button>
    </div>
  );
};

describe('AlertManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render children correctly', () => {
    render(
      <AlertProvider>
        <div data-testid="child">Child Content</div>
      </AlertProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should show alert with correct type', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );
    
    const successButton = screen.getByText('Show Success');
    act(() => {
      fireEvent.click(successButton);
    });
    
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-type', 'success');
    expect(alert).toHaveTextContent('Success message');
  });

  it('should auto-dismiss alert after 3 seconds', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );
    
    const successButton = screen.getByText('Show Success');
    act(() => {
      fireEvent.click(successButton);
    });
    
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
  });

  it('should support multiple alert types', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Info'));
    });
    
    const alerts = screen.getAllByTestId('alert');
    expect(alerts).toHaveLength(3);
    expect(alerts[0]).toHaveAttribute('data-type', 'success');
    expect(alerts[1]).toHaveAttribute('data-type', 'error');
    expect(alerts[2]).toHaveAttribute('data-type', 'info');
  });

  it('should dismiss alert when close button is clicked', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
    });
    
    const closeButton = screen.getByTestId('close-button');
    act(() => {
      fireEvent.click(closeButton);
    });
    
    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
  });

  it('should not auto-dismiss when duration is 0', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByText('Show No Dismiss'));
    });
    
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(screen.getByTestId('alert')).toBeInTheDocument();
  });

  it('should throw error when useAlert is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const TestComponentWithoutProvider = () => {
      useAlert();
      return null;
    };
    
    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useAlert must be used within an AlertProvider');
    
    consoleSpy.mockRestore();
  });

  it('should have correct fixed positioning styles', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
    });
    
    const alertContainer = screen.getByTestId('alert').parentElement;
    expect(alertContainer).toHaveStyle({
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: '9999',
    });
  });

  it('should have slide-in animation', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
    });
    
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveStyle({
      animation: 'slideInRight 0.3s ease',
    });
  });
});
