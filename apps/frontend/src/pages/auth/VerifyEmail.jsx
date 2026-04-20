import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateUser } = useAuth();

    const email = location.state?.email || '';
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputs = useRef([]);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 5) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) {
            inputs.current[i - 1]?.focus();
        }
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
        setLoading(true);
        setError('');
        try {
            const { data } = await API.post('/auth/verify-email', { email, otp: code });
            updateUser(data);
            setSuccess('Email verified! Redirecting...');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        try {
            await API.post('/auth/resend-otp', { email });
            setSuccess('New OTP sent to your email');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="page container animate-fadeIn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Verify Your Email</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: '0.9rem' }}>
                    We sent a 6-digit OTP to
                </p>
                <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 32 }}>{email}</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => inputs.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(i, e.target.value)}
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

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>}
                    {success && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: 16 }}>{success}</p>}

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: 16 }}>
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Didn't receive it?{' '}
                    <button onClick={handleResend} disabled={resending} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                        {resending ? 'Sending...' : 'Resend OTP'}
                    </button>
                </p>
            </div>
        </div>
    );
}
