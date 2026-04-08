import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const pwStrength = (() => {
        const p = form.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 6) s++;
        if (p.length >= 10) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    })();

    const pwLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][pwStrength];
    const pwColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#059669'][pwStrength];

    const field = (key, label, type, placeholder, icon) => (
        <div className="form-group">
            <label>{label}</label>
            <div style={{ position: 'relative' }}>
                <span style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    display: 'flex', pointerEvents: 'none',
                }}>{icon}</span>
                <input
                    className="form-control"
                    type={key === 'password' ? (showPw ? 'text' : 'password') : type}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={key !== 'phone'}
                    minLength={key === 'password' ? 6 : undefined}
                    style={{ paddingLeft: 40, paddingRight: key === 'password' ? 44 : 14 }}
                />
                {key === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        style={{
                            position: 'absolute', right: 12, top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none', color: 'var(--text-muted)', padding: 4,
                        }}
                    >
                        {showPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: 'calc(100vh - 72px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 16px',
            background: 'var(--surface)',
        }}>
            <div style={{
                width: '100%', maxWidth: 460,
                animation: 'slideUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards',
            }}>
                <div style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '44px 40px',
                    boxShadow: '0 8px 32px rgba(31,27,20,0.08)',
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '20px',
                            background: 'var(--primary-glow)',
                            border: '1px solid rgba(160,65,0,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', margin: '0 auto 18px',
                        }}>🍿</div>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: 6 }}>
                            Create account
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                            Join the Sangam Namkeen family
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 20 }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {field('name', 'Full Name', 'text', 'Your full name', <FiUser />)}
                        {field('email', 'Email Address', 'email', 'you@example.com', <FiMail />)}
                        {field('phone', 'Phone (optional)', 'tel', '+91 98765 43210', <FiPhone />)}
                        {field('password', 'Password', 'password', 'Min 6 characters', <FiLock />)}

                        {/* Password strength */}
                        {form.password && (
                            <div style={{ marginTop: -12, marginBottom: 20 }}>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} style={{
                                            flex: 1, height: 3, borderRadius: 2,
                                            background: i <= pwStrength ? pwColor : 'var(--border)',
                                            transition: 'background 0.3s',
                                        }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: pwColor, fontWeight: 600 }}>
                                    {pwLabel}
                                </span>
                            </div>
                        )}

                        {/* Benefits */}
                        <div style={{
                            background: 'var(--surface-container)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '14px 16px',
                            marginBottom: 20,
                            display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                            {['Free delivery on first order', 'Exclusive member discounts', 'Order tracking & history'].map(b => (
                                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    <FiCheck size={13} style={{ color: 'var(--success)', flexShrink: 0 }} /> {b}
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                    Creating account...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                    Create Account <FiArrowRight />
                                </span>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
