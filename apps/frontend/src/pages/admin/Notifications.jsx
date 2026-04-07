import { useState, useEffect, useCallback } from 'react';
import { FiBell, FiMail, FiSend, FiTrash2, FiCheck, FiClock } from 'react-icons/fi';
import API from '../../api/axios';

// ─── Broadcast Tab ───
function BroadcastTab() {
    const [notifications, setNotifications] = useState([]);
    const [form, setForm] = useState({ title: '', body: '', recipients: 'all' });
    const [showForm, setShowForm] = useState(false);

    const loadNotifications = useCallback(() => {
        API.get('/notifications?type=broadcast').then(res => setNotifications(res.data));
    }, []);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await API.post('/notifications', { ...form, type: 'broadcast' });
        setForm({ title: '', body: '', recipients: 'all' });
        setShowForm(false);
        loadNotifications();
    };

    const handleSend = async (id) => {
        await API.put(`/notifications/${id}/send`);
        loadNotifications();
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this notification?')) { await API.delete(`/notifications/${id}`); loadNotifications(); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3><FiBell /> Broadcast Notifications</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Notification'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="form-group">
                        <label>Title</label>
                        <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title" required />
                    </div>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea className="form-control" rows={3} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your notification message..." required />
                    </div>
                    <div className="form-group">
                        <label>Recipients</label>
                        <select className="form-control" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} style={{ maxWidth: 250 }}>
                            <option value="all">All Users</option>
                            <option value="users">Customers Only</option>
                            <option value="staff">Staff Only</option>
                        </select>
                    </div>
                    <button className="btn btn-primary"><FiSend /> Create Notification</button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {notifications.map(n => (
                    <div key={n._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <h4>{n.title}</h4>
                                {n.isSent ? (
                                    <span className="badge badge-delivered"><FiCheck /> Sent</span>
                                ) : (
                                    <span className="badge badge-pending"><FiClock /> Draft</span>
                                )}
                                <span className="badge badge-confirmed">{n.recipients}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>{n.body}</p>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Created: {new Date(n.createdAt).toLocaleString('en-IN')}
                                {n.sentAt && ` • Sent: ${new Date(n.sentAt).toLocaleString('en-IN')}`}
                            </small>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {!n.isSent && (
                                <button className="btn btn-primary btn-sm" onClick={() => handleSend(n._id)}>
                                    <FiSend /> Broadcast
                                </button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n._id)}><FiTrash2 /></button>
                        </div>
                    </div>
                ))}
                {notifications.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <FiBell style={{ fontSize: '2rem', marginBottom: 12 }} />
                        <p>No notifications yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Email Campaign Tab (Placeholder) ───
function EmailCampaignTab() {
    const [campaigns, setCampaigns] = useState([]);
    const [form, setForm] = useState({ title: '', subject: '', body: '', recipients: 'all' });
    const [showForm, setShowForm] = useState(false);

    const loadCampaigns = useCallback(() => {
        API.get('/notifications?type=email_campaign').then(res => setCampaigns(res.data));
    }, []);

    useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await API.post('/notifications', { ...form, type: 'email_campaign' });
        setForm({ title: '', subject: '', body: '', recipients: 'all' });
        setShowForm(false);
        loadCampaigns();
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this campaign?')) { await API.delete(`/notifications/${id}`); loadCampaigns(); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3><FiMail /> Email Campaigns</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Campaign'}
                </button>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
                📧 Email sending requires an email service integration (SendGrid, AWS SES, etc.). Campaigns are saved as drafts for now.
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label>Campaign Name</label>
                            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Summer Sale Announcement" required />
                        </div>
                        <div className="form-group">
                            <label>Recipients</label>
                            <select className="form-control" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })}>
                                <option value="all">All Users</option>
                                <option value="users">Customers Only</option>
                                <option value="staff">Staff Only</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email Subject</label>
                        <input className="form-control" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Email subject line" required />
                    </div>
                    <div className="form-group">
                        <label>Email Body</label>
                        <textarea className="form-control" rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your email content..." required />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-primary"><FiMail /> Save Campaign</button>
                    </div>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {campaigns.map(c => (
                    <div key={c._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <h4>{c.title}</h4>
                                <span className="badge badge-processing">Draft</span>
                                <span className="badge badge-confirmed">{c.recipients}</span>
                            </div>
                            {c.subject && <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4, fontWeight: 500 }}>Subject: {c.subject}</p>}
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.body.substring(0, 150)}{c.body.length > 150 ? '...' : ''}</p>
                            <small style={{ color: 'var(--text-muted)' }}>Created: {new Date(c.createdAt).toLocaleString('en-IN')}</small>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" disabled title="Email service not configured">
                                <FiSend /> Send
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}><FiTrash2 /></button>
                        </div>
                    </div>
                ))}
                {campaigns.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <FiMail style={{ fontSize: '2rem', marginBottom: 12 }} />
                        <p>No email campaigns yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Notifications Page ───
export default function Notifications() {
    const [tab, setTab] = useState('broadcast');

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Notifications & Campaigns</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button className={`btn btn-sm ${tab === 'broadcast' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('broadcast')}>
                    <FiBell /> Broadcast
                </button>
                <button className={`btn btn-sm ${tab === 'email' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('email')}>
                    <FiMail /> Email Campaigns
                </button>
            </div>

            {tab === 'broadcast' && <BroadcastTab />}
            {tab === 'email' && <EmailCampaignTab />}
        </div>
    );
}
