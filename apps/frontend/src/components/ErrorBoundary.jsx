import { Component } from 'react';
import { logErrorToService } from '../utils/logger';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to service
        logErrorToService(error, errorInfo);
        
        // Update state with error info
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null 
        });
        
        // Navigate to home page
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '40px 20px',
                    background: 'var(--surface)',
                    color: 'var(--on-surface)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '80px',
                        marginBottom: '20px'
                    }}>
                        😕
                    </div>
                    
                    <h1 style={{
                        fontSize: '2rem',
                        marginBottom: '16px',
                        color: 'var(--on-surface)'
                    }}>
                        Oops! Something went wrong
                    </h1>
                    
                    <p style={{
                        fontSize: '1.1rem',
                        marginBottom: '32px',
                        color: 'var(--on-surface-variant)',
                        maxWidth: '500px'
                    }}>
                        We're sorry for the inconvenience. Our team has been notified and is working on a fix.
                    </p>

                    {import.meta.env.MODE === 'development' && this.state.error && (
                        <details style={{
                            marginBottom: '32px',
                            padding: '16px',
                            background: 'var(--surface-container)',
                            borderRadius: '8px',
                            maxWidth: '600px',
                            width: '100%',
                            textAlign: 'left'
                        }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontWeight: 600,
                                marginBottom: '8px',
                                color: 'var(--error)'
                            }}>
                                Error Details (Development Only)
                            </summary>
                            <pre style={{
                                fontSize: '0.85rem',
                                overflow: 'auto',
                                padding: '12px',
                                background: 'var(--surface-container-highest)',
                                borderRadius: '4px',
                                color: 'var(--on-surface)'
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo && (
                                    <>
                                        {'\n\n'}
                                        {this.state.errorInfo.componentStack}
                                    </>
                                )}
                            </pre>
                        </details>
                    )}
                    
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <button 
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                            style={{
                                padding: '12px 24px',
                                fontSize: '1rem'
                            }}
                        >
                            🔄 Refresh Page
                        </button>
                        
                        <button 
                            onClick={this.handleReset}
                            className="btn btn-secondary"
                            style={{
                                padding: '12px 24px',
                                fontSize: '1rem'
                            }}
                        >
                            🏠 Go to Home
                        </button>
                    </div>

                    <p style={{
                        marginTop: '40px',
                        fontSize: '0.9rem',
                        color: 'var(--on-surface-variant)'
                    }}>
                        If the problem persists, please contact support.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
