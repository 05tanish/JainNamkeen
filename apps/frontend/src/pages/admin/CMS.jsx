import { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiPlus, FiTrash2, FiEdit, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

export default function CMS() {
    const [pages, setPages] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', slug: '', content: '', isActive: true });

    const loadPages = useCallback(() => {
        API.get('/pages').then(res => setPages(res.data));
    }, []);

    useEffect(() => { loadPages(); }, [loadPages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await API.put(`/pages/${editing}`, form);
            } else {
                await API.post('/pages', form);
            }
            setShowForm(false);
            setEditing(null);
            setForm({ title: '', slug: '', content: '', isActive: true });
            loadPages();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving page');
        }
    };

    const handleEdit = (page) => {
        setForm({
            title: page.title,
            slug: page.slug,
            content: page.content,
            isActive: page.isActive
        });
        setEditing(page._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this page?')) {
            await API.delete(`/pages/${id}`);
            loadPages();
        }
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        if (!editing) {
            // Auto-generate slug for new pages
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            setForm({ ...form, title, slug });
        } else {
            setForm({ ...form, title });
        }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)' }}><FiFileText /> Content Management (CMS)</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', slug: '', content: '', isActive: true }); }}>
                    {showForm ? 'Cancel' : <><FiPlus /> Create Page</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label>Page Title</label>
                            <input className="form-control" value={form.title} onChange={handleTitleChange} required placeholder="e.g. About Us" />
                        </div>
                        <div className="form-group">
                            <label>URL Slug</label>
                            <input className="form-control" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} required placeholder="e.g. about-us" />
                            <small style={{ color: 'var(--text-muted)' }}>The URL will be: /pages/{form.slug || '...'}</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Page Content (HTML/Text)</label>
                        <textarea
                            className="form-control"
                            rows={15}
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            required
                            placeholder="<h1>Welcome to Sangam Namkeen</h1><p>Our story begins...</p>"
                            style={{ fontFamily: 'monospace' }}
                        />
                        <small style={{ color: 'var(--text-muted)' }}>You can use standard HTML tags for formatting (h1, h2, p, strong, ul, li).</small>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                            Page is published and visible to users
                        </label>
                    </div>

                    <button className="btn btn-primary"><FiFileText /> {editing ? 'Update' : 'Publish'} Page</button>
                </form>
            )}

            <div className="table-container">
                <table>
                    <thead><tr><th>Title</th><th>URL Slug</th><th>Status</th><th>Last Updated</th><th>Actions</th></tr></thead>
                    <tbody>
                        {pages.map(p => (
                            <tr key={p._id}>
                                <td><strong>{p.title}</strong></td>
                                <td><span style={{ fontFamily: 'monospace', color: 'var(--info)' }}>/pages/{p.slug}</span></td>
                                <td>
                                    <span className={`badge badge-${p.isActive ? 'confirmed' : 'pending'}`}>
                                        {p.isActive ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td>{new Date(p.updatedAt).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <Link to={`/pages/${p.slug}`} target="_blank" className="btn btn-sm btn-secondary" title="View Page">
                                            <FiExternalLink />
                                        </Link>
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}><FiEdit /></button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {pages.length === 0 && (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No pages found. Create a page to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
