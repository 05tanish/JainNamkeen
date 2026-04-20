import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../../api/axios';

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputs = useRef([]);

    const handleOtpChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 5) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter the 6-digit OTP'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        setError('');
        try {
            await API.post('/auth/reset-password', { email, otp: code, newPassword });
            setSuccess('Password reset! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
            <div className="card" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔑</div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Reset Password</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Enter the OTP sent to <strong>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {!location.state?.email && (
                        <div className="form-group">
                            <label>Email Address</label>
                            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                    )}

                    <div className="form-group">
                        <label>OTP</label>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => inputs.current[i] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    style={{
                                        width: 48, height: 56, textAlign: 'center', fontSize: '1.5rem',
                                        fontWeight: 700, border: '2px solid var(--border)',
                                        borderRadius: 'var(--radius-sm)', background: 'var(--surface-container)',
                                        color: 'var(--text-primary)', outline: 'none',
                                        borderColor: digit ? 'var(--primary)' : 'var(--border)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input className="form-control" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required />
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>}
                    {success && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: 16 }}>{success}</p>}

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Link to="/forgot-password" style={{ color: 'var(--primary)' }}>Resend OTP</Link>
                    {' · '}
                    <Link to="/login" style={{ color: 'var(--primary)' }}>Back to Login</Link>
                </p>
            </div>
        </div>
    );
}
