import { useState, useEffect, useCallback } from 'react';
import { FiUser, FiLock, FiHome, FiPhone, FiMail } from 'react-icons/fi';
import API from '../../api/axios';
import './Profile.css';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwError, setPwError] = useState('');

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: ''
        }
    });

    const [pwForm, setPwForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const loadProfile = useCallback(async () => {
        try {
            const res = await API.get('/auth/me');
            setUser(res.data);
            setForm({
                name: res.data.name || '',
                phone: res.data.phone || '',
                address: {
                    street: res.data.address?.street || '',
                    city: res.data.address?.city || '',
                    state: res.data.address?.state || '',
                    pincode: res.data.address?.pincode || ''
                }
            });
            setLoading(false);
        } catch {
            setError('Failed to load profile');
            setLoading(false);
        }
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await API.put('/auth/profile', form);
            setSuccess('Profile updated successfully!');
            // Update local user data if needed
            const updatedUser = { ...user, ...form };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (pwForm.newPassword !== pwForm.confirmPassword) {
            return setPwError('New passwords do not match');
        }

        try {
            await API.put('/auth/password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword
            });
            setPwSuccess('Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwError(err.response?.data?.message || 'Password update failed');
        }
    };

    if (loading) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container profile-page animate-fadeIn">
            <h1 className="page-title"><FiUser /> My Profile</h1>

            <div className="profile-grid">
                {/* Profile Details Form */}
                <div className="card profile-card">
                    <h3>Account Information</h3>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label><FiMail /> Email Address</label>
                            <input className="form-control" value={user?.email} disabled style={{ background: 'var(--bg-secondary)' }} />
                            <small>Email cannot be changed</small>
                        </div>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                className="form-control"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label><FiPhone /> Phone Number</label>
                            <input
                                className="form-control"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>

                        <h4 style={{ marginTop: 24, marginBottom: 16 }}><FiHome /> Shipping Address</h4>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input
                                className="form-control"
                                value={form.address.street}
                                onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                            />
                        </div>

                        <div className="grid grid-3">
                            <div className="form-group">
                                <label>City</label>
                                <input
                                    className="form-control"
                                    value={form.address.city}
                                    onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input
                                    className="form-control"
                                    value={form.address.state}
                                    onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Pincode</label>
                                <input
                                    className="form-control"
                                    value={form.address.pincode}
                                    onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Update Profile</button>
                    </form>
                </div>

                {/* Password Change Form */}
                <div className="card profile-card">
                    <h3>Security</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Update your account password regularly to keep your account secure.</p>

                    {pwError && <div className="alert alert-danger">{pwError}</div>}
                    {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}

                    <form onSubmit={handlePasswordUpdate}>
                        <div className="form-group">
                            <label><FiLock /> Current Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={pwForm.currentPassword}
                                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={pwForm.newPassword}
                                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={pwForm.confirmPassword}
                                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-secondary" style={{ marginTop: 16 }}>Change Password</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
