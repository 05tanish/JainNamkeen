import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
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
        <div style={{
            minHeight: 'calc(100vh - 72px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 16px',
            background: 'var(--surface)',
        }}>
            <div style={{
                width: '100%', maxWidth: 440,
                animation: 'slideUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards',
            }}>
                {/* Card */}
                <div style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '44px 40px',
                    boxShadow: '0 8px 32px rgba(31,27,20,0.08)',
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 36 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '20px',
                            background: 'var(--primary-glow)',
                            border: '1px solid rgba(160,65,0,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', margin: '0 auto 18px',
                        }}>🍿</div>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: 6 }}>
                            Welcome back
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                            Sign in to your Sangam Namkeen account
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 24 }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="form-group">
                            <label>Email address</label>
                            <div style={{ position: 'relative' }}>
                                <FiMail style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                                }} />
                                <input
                                    className="form-control"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    style={{ paddingLeft: 40 }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                                <label style={{ margin: 0 }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <FiLock style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                                }} />
                                <input
                                    className="form-control"
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingLeft: 40, paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', color: 'var(--text-muted)',
                                        fontSize: '1rem', padding: 4,
                                    }}
                                >
                                    {showPw ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 8, padding: '14px', fontSize: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                    Signing in...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                    Sign In <FiArrowRight />
                                </span>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Create one</Link>
                    </p>
                </div>

                {/* Demo credentials */}
                <div style={{
                    marginTop: 16, padding: '16px 20px',
                    background: 'var(--surface-container)',
                    border: '1px solid rgba(160,65,0,0.15)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8rem', color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                }}>
                    <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4 }}>🔑 Demo Accounts</strong>
                    Admin: admin@sangamnamkeen.com / admin123<br />
                    Staff: staff@sangamnamkeen.com / staff123<br />
                    User: user@test.com / user123
                </div>
            </div>
        </div>
    );
}
