import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login(email, password);
            if (data.user.role === 'admin') navigate('/admin');
            else if (data.user.role === 'staff') navigate('/staff');
            else navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-slideUp" style={{ maxWidth: 440, width: '100%', padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🍿</div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Login to your Sangam Namkeen account</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
                </p>

                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Demo Accounts:</strong><br />
                    Admin: admin@sangamnamkeen.com / admin123<br />
                    Staff: staff@sangamnamkeen.com / staff123<br />
                    User: user@test.com / user123
                </div>
            </div>
        </div>
    );
}
