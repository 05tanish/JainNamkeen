import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await API.post('/auth/forgot-password', { email });
            setSent(true);
            setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
            <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔐</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Forgot Password?</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.9rem' }}>
                    Enter your email and we'll send you an OTP to reset your password.
                </p>

                {sent ? (
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                        ✓ OTP sent! Redirecting...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label>Email Address</label>
                            <input
                                className="form-control"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>}
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                <p style={{ marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Remember your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
