import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, roles }) {
    const { user, isInitialized } = useAuth();

    // Wait for session verification before deciding to redirect.
    // This prevents a flash-redirect when the page first loads and
    // the auth state is still being confirmed via /api/auth/me.
    if (!isInitialized) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'var(--bg-primary, #0f0f0f)'
            }}>
                <div style={{
                    width: 40, height: 40, border: '3px solid var(--primary, #f97316)',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
            </div>
        );
    }

    // No authenticated user → go to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Wrong role → redirect to appropriate page
    if (roles && !roles.includes(user.role)) {
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
        if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}
