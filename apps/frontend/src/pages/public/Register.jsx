import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
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

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-slideUp" style={{ maxWidth: 440, width: '100%', padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🍿</div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join Sangam Namkeen family</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input className="form-control" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required minLength={6} />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
                </p>
            </div>
        </div>
    );
}
