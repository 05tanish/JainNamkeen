import { useState, useEffect, useCallback } from 'react';
import { FiImage, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiExternalLink } from 'react-icons/fi';
import API from '../../api/axios';

export default function Banners() {
    const [banners, setBanners] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        title: '', subtitle: '', link: '', position: 'hero', image: null, startDate: '', endDate: ''
    });

    const loadBanners = useCallback(() => {
        API.get('/banners').then(res => setBanners(res.data));
    }, []);

    useEffect(() => { loadBanners(); }, [loadBanners]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('subtitle', form.subtitle);
        formData.append('link', form.link);
        formData.append('position', form.position);
        if (form.startDate) formData.append('startDate', form.startDate);
        if (form.endDate) formData.append('endDate', form.endDate);
        if (form.image) formData.append('image', form.image);

        if (editing) {
            await API.put(`/banners/${editing}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
            await API.post('/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }

        setShowForm(false); setEditing(null);
        setForm({ title: '', subtitle: '', link: '', position: 'hero', image: null, startDate: '', endDate: '' });
        loadBanners();
    };

    const handleEdit = (b) => {
        setForm({
            title: b.title, subtitle: b.subtitle || '', link: b.link || '',
            position: b.position, image: null,
            startDate: b.startDate ? b.startDate.split('T')[0] : '',
            endDate: b.endDate ? b.endDate.split('T')[0] : ''
        });
        setEditing(b._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this banner?')) { await API.delete(`/banners/${id}`); loadBanners(); }
    };

    const handleToggle = async (id) => {
        await API.put(`/banners/${id}/toggle`);
        loadBanners();
    };

    const positionColors = { hero: 'var(--primary)', sidebar: 'var(--info)', popup: 'var(--warning)', footer: 'var(--text-muted)' };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)' }}><FiImage /> Banner Management</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', subtitle: '', link: '', position: 'hero', image: null, startDate: '', endDate: '' }); }}>
                    {showForm ? 'Cancel' : <><FiPlus /> Add Banner</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label>Title</label>
                            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Subtitle</label>
                            <input className="form-control" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Link URL</label>
                            <input className="form-control" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="e.g. /products" />
                        </div>
                        <div className="form-group">
                            <label>Position</label>
                            <select className="form-control" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                                <option value="hero">Hero</option>
                                <option value="sidebar">Sidebar</option>
                                <option value="popup">Popup</option>
                                <option value="footer">Footer</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Banner Image</label>
                            <input className="form-control" type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files[0] })} />
                            {editing && !form.image && <small style={{ color: 'var(--text-muted)' }}>Leave empty to keep current image</small>}
                        </div>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input className="form-control" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input className="form-control" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                        </div>
                    </div>
                    <button className="btn btn-primary">{editing ? 'Update' : 'Create'} Banner</button>
                </form>
            )}

            <div className="grid grid-2">
                {banners.map(b => (
                    <div key={b._id} className="card" style={{ overflow: 'hidden' }}>
                        {b.image && (
                            <div style={{ height: 140, background: 'var(--bg-surface)', marginBottom: 16, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                <img src={b.image?.startsWith('http') ? b.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${b.image}`} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                            <div>
                                <h4 style={{ marginBottom: 4 }}>{b.title}</h4>
                                {b.subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{b.subtitle}</p>}
                            </div>
                            <span className="badge" style={{ background: `${positionColors[b.position]}20`, color: positionColors[b.position] }}>
                                {b.position}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {b.link && (
                                <span style={{ fontSize: '0.82rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <FiExternalLink /> {b.link}
                                </span>
                            )}
                            <span style={{ color: b.isActive ? 'var(--success)' : 'var(--danger)', fontSize: '0.82rem', fontWeight: 600 }}>
                                {b.isActive ? '● Active' : '● Inactive'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(b)}>Edit</button>
                            <button className="btn btn-sm" style={{ background: b.isActive ? 'var(--warning)' : 'var(--success)', color: 'white' }} onClick={() => handleToggle(b._id)}>
                                {b.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}><FiTrash2 /></button>
                        </div>
                    </div>
                ))}
                {banners.length === 0 && (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <FiImage style={{ fontSize: '2rem', marginBottom: 12 }} />
                        <p>No banners yet. Create your first banner above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
