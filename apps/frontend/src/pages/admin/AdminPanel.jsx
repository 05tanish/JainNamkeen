import { useState, useEffect, useCallback } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FiGrid, FiBox, FiTag, FiShoppingBag, FiUsers, FiLogOut, FiUser, FiCalendar, FiMapPin, FiPercent, FiImage, FiBell, FiAlertTriangle, FiTruck, FiXCircle, FiFileText, FiStar, FiMessageSquare } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Promotions from './Promotions';
import Banners from './Banners';
import Notifications from './Notifications';
import CMS from './CMS';

// ... (Dashboard to AdminAttendance components remain the same, I'm replacing from imports to the end, wait, this is line 1 to 1005. I need to be more precise)
function Dashboard() {
    const [stats, setStats] = useState({});
    const [recentOrders, setRecentOrders] = useState([]);
    const [conversionData, setConversionData] = useState({});
    const [lowStock, setLowStock] = useState({ count: 0, products: [] });
    const [refundStats, setRefundStats] = useState({});

    useEffect(() => {
        API.get('/orders/stats').then(res => {
            setStats(res.data);
            setRecentOrders(res.data.recentOrders || []);
        });
        API.get('/admin/conversion-rate').then(res => setConversionData(res.data)).catch(() => { });
        API.get('/admin/low-stock').then(res => setLowStock(res.data)).catch(() => { });
        API.get('/admin/refund-stats').then(res => setRefundStats(res.data)).catch(() => { });
    }, []);

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Dashboard</h2>

            {/* Primary Stats */}
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(232,117,26,0.12)', color: 'var(--primary)' }}>₹</div>
                    <div className="stat-info"><h3>₹{stats.totalRevenue?.toLocaleString() || 0}</h3><p>Total Revenue</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>₹</div>
                    <div className="stat-info"><h3>₹{stats.totalProfit?.toLocaleString() || 0}</h3><p>Net Profit</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--info)' }}><FiShoppingBag /></div>
                    <div className="stat-info"><h3>{stats.totalOrders || 0}</h3><p>Total Orders</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}><FiBox /></div>
                    <div className="stat-info"><h3>{stats.pendingOrders || 0}</h3><p>Pending Orders</p></div>
                </div>
            </div>

            {/* Secondary Stats — Conversion, Low Stock, Refunds */}
            <div className="grid grid-3" style={{ marginBottom: 32 }}>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--info)' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--info)' }}>📊</div>
                    <div className="stat-info">
                        <h3>{conversionData.conversionRate || 0}%</h3>
                        <p>Conversion Rate</p>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {conversionData.usersWithOrders || 0} / {conversionData.totalUsers || 0} users
                        </small>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: `3px solid ${lowStock.count > 0 ? 'var(--danger)' : 'var(--success)'}` }}>
                    <div className="stat-icon" style={{ background: lowStock.count > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: lowStock.count > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        <FiAlertTriangle />
                    </div>
                    <div className="stat-info">
                        <h3>{lowStock.count || 0}</h3>
                        <p>Low Stock Alerts</p>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Products below threshold
                        </small>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}><FiXCircle /></div>
                    <div className="stat-info">
                        <h3>{stats.refundRequests || 0}</h3>
                        <p>Refund Requests</p>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {stats.cancelledOrders || 0} cancelled | {refundStats.returnRate || 0}% return rate
                        </small>
                    </div>
                </div>
            </div>

            <div className="grid grid-2" style={{ gap: 24, marginBottom: 32 }}>
                {/* Recent Orders */}
                <div>
                    <h3 style={{ marginBottom: 16 }}>Recent Orders</h3>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id?.slice(-6).toUpperCase()}</td>
                                        <td>{order.user?.name || 'N/A'}</td>
                                        <td>₹{order.totalAmount}</td>
                                        <td><span className={`badge badge-${order.status?.toLowerCase()}`}>{order.status?.toLowerCase()}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Sales by Location */}
                <div>
                    <h3 style={{ marginBottom: 16 }}><FiMapPin /> Sales by Location</h3>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Location</th><th>Orders</th><th>Revenue</th></tr></thead>
                            <tbody>
                                {(stats.locationStats || []).map((loc, i) => (
                                    <tr key={i}>
                                        <td>{loc.city ?? loc._id?.city}, {loc.state ?? loc._id?.state}</td>
                                        <td>{loc.count}</td>
                                        <td>₹{loc.revenue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Low Stock Alerts Table */}
            {lowStock.count > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ marginBottom: 16, color: 'var(--danger)' }}><FiAlertTriangle /> Low Stock Alerts</h3>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Threshold</th><th>Price</th><th>Urgency</th></tr></thead>
                            <tbody>
                                {lowStock.products.map(p => (
                                    <tr key={p.id}>
                                        <td><strong>{p.name}</strong></td>
                                        <td>{p.category || '—'}</td>
                                        <td style={{ color: p.stock === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>{p.stock}</td>
                                        <td>{p.threshold}</td>
                                        <td>₹{p.price}</td>
                                        <td>
                                            {p.stock === 0 ? (
                                                <span className="badge badge-cancelled">OUT OF STOCK</span>
                                            ) : (
                                                <span className="badge badge-pending">LOW</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Refunds */}
            {(refundStats.recentRefunds || []).length > 0 && (
                <div>
                    <h3 style={{ marginBottom: 16 }}><FiXCircle /> Recent Refund Requests</h3>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Refund Status</th><th>Reason</th></tr></thead>
                            <tbody>
                                {refundStats.recentRefunds.map(r => (
                                    <tr key={r.id}>
                                        <td>#{r.id?.slice(-6).toUpperCase()}</td>
                                        <td>{r.user?.name || 'N/A'}</td>
                                        <td>₹{r.refundAmount || r.totalAmount}</td>
                                        <td><span className={`badge badge-${r.refundStatus === 'COMPLETED' ? 'delivered' : r.refundStatus === 'APPROVED' ? 'confirmed' : 'pending'}`}>{r.refundStatus?.toLowerCase()}</span></td>
                                        <td style={{ color: 'var(--text-muted)' }}>{r.refundReason || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Products Management ───
function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', price: '', costPrice: '', category: '', stock: '', weight: '250g', isFeatured: false, isActive: true });
    const [images, setImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const loadProducts = useCallback(() => {
        API.get('/products/all').then(res => setProducts(res.data));
    }, []);

    useEffect(() => {
        loadProducts();
        API.get('/categories').then(res => setCategories(res.data));
    }, [loadProducts]);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        
        setIsUploading(true);
        try {
            const res = await API.post('/products/upload-images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImages(prev => [...prev, ...res.data.images]);
        } catch (error) {
            console.error('Failed to upload image', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
            // clear file input
            e.target.value = null;
        }
    };

    const handleRemoveImage = async (public_id, index) => {
        if (!confirm('Remove this image?')) return;
        
        try {
            await API.post('/products/remove-image', { public_id });
            setImages(prev => prev.filter((_, i) => i !== index));
        } catch (error) {
            console.error('Failed to remote image', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const productData = { ...form, images };

        if (editing) {
            await API.put(`/products/${editing}`, productData);
        } else {
            await API.post('/products', productData);
        }
        setShowForm(false);
        setEditing(null);
        setForm({ name: '', description: '', price: '', costPrice: '', category: '', stock: '', weight: '250g', isFeatured: false, isActive: true });
        setImages([]);
        loadProducts();
    };

    const handleEdit = (p) => {
        setForm({ name: p.name, description: p.description, price: p.price, costPrice: p.costPrice || 0, category: p.category?.id || p.category, stock: p.stock, weight: p.weight, isFeatured: p.isFeatured, isActive: p.isActive !== false });
        const productImages = p.images && p.images.length > 0 ? p.images : (p.image ? [{ url: p.image }] : []);
        setImages(productImages);
        setEditing(p.id);
        setShowForm(true);
    };

    const toggleStatus = async (id) => {
        await API.put(`/products/${id}/status`);
        loadProducts();
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this product?')) {
            await API.delete(`/products/${id}`);
            loadProducts();
        }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)' }}>Products</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', price: '', category: '', stock: '', weight: '250g', isFeatured: false, isActive: true }); setImages([]); }}>
                    {showForm ? 'Cancel' : '+ Add Product'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label>Name</label>
                            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                                <option value="">Select</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sale Price (₹)</label>
                            <input className="form-control" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Cost Price (₹)</label>
                            <input className="form-control" type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Stock</label>
                            <input className="form-control" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Weight</label>
                            <input className="form-control" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Product Images (Cloudinary)</label>
                            
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                                {images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', width: 80, height: 80, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                        <img src={img.url} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {img.public_id && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveImage(img.public_id, idx)}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {images.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>No images added yet.</div>}
                            </div>
                            
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 8, padding: 24, cursor: isUploading ? 'not-allowed' : 'pointer', background: 'var(--bg-surface)' }}>
                                <FiImage style={{ fontSize: 24, color: 'var(--text-secondary)', marginBottom: 8 }} />
                                <span style={{ color: 'var(--text-secondary)' }}>{isUploading ? 'Uploading...' : 'Click to select or drag & drop images'}</span>
                                <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploading} />
                            </label>
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'end', gap: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                                Featured
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                                Active
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <button className="btn btn-primary">{editing ? 'Update' : 'Create'} Product</button>
                </form>
            )}

            <div className="table-container">
                <table>
                    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id}>
                                <td><strong>{p.name}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{p.weight}</small></td>
                                <td>{p.category?.name}</td>
                                <td>₹{p.price}</td>
                                <td><span style={{ color: p.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>{p.stock}</span></td>
                                <td>
                                    <span style={{ color: p.isActive !== false ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                        {p.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                                        <button className="btn btn-sm" style={{ background: p.isActive !== false ? 'var(--warning)' : 'var(--success)', color: 'white' }} onClick={() => toggleStatus(p.id)}>
                                            {p.isActive !== false ? 'Disable' : 'Enable'}
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Categories Management ───
function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '' });

    const loadCategories = useCallback(() => API.get('/categories').then(res => setCategories(res.data)), []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editing) await API.put(`/categories/${editing}`, form);
        else await API.post('/categories', form);
        setShowForm(false); setEditing(null); setForm({ name: '', description: '' });
        loadCategories();
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this category?')) { await API.delete(`/categories/${id}`); loadCategories(); }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)' }}>Categories</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '' }); }}>
                    {showForm ? 'Cancel' : '+ Add Category'}
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="grid grid-2">
                        <div className="form-group"><label>Name</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="form-group"><label>Description</label><input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
                </form>
            )}
            <div className="table-container">
                <table>
                    <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
                    <tbody>
                        {categories.map(c => (
                            <tr key={c.id}>
                                <td><strong>{c.name}</strong></td>
                                <td style={{ color: 'var(--text-secondary)' }}>{c.description}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ name: c.name, description: c.description }); setEditing(c.id); setShowForm(true); }}>Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Orders Management (Enhanced with Refund/Tracking) ───
function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [refundModal, setRefundModal] = useState(null);
    const [refundForm, setRefundForm] = useState({ refundStatus: 'APPROVED', refundReason: '', refundAmount: '' });
    const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', carrier: '', trackingUrl: '' });

    const loadOrders = useCallback(() => {
        const params = filter ? `?status=${filter}` : '';
        API.get(`/orders${params}`).then(res => setOrders(res.data.orders || []));
    }, [filter]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const updateStatus = async (id, status) => {
        await API.put(`/orders/${id}/status`, { status });
        loadOrders();
    };

    const handleRefund = async (e) => {
        e.preventDefault();
        await API.put(`/orders/${refundModal.id}/refund`, {
            ...refundForm,
            refundAmount: refundForm.refundAmount || refundModal.totalAmount
        });
        setRefundModal(null);
        setRefundForm({ refundStatus: 'APPROVED', refundReason: '', refundAmount: '' });
        loadOrders();
    };

    const handleTracking = async (orderId) => {
        await API.put(`/orders/${orderId}/tracking`, trackingForm);
        setTrackingForm({ trackingNumber: '', carrier: '', trackingUrl: '' });
        const res = await API.get(`/orders/${orderId}`);
        setSelectedOrder(res.data);
        loadOrders();
    };

    const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Orders</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('')}>All</button>
                {statuses.map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s.toLowerCase()}</button>
                ))}
            </div>

            {/* Refund Modal */}
            {refundModal && (
                <div className="modal-overlay" onClick={() => setRefundModal(null)}>
                    <div className="card" style={{ width: '90%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 20, color: 'var(--danger)' }}><FiXCircle /> Process Refund — #{refundModal.id?.slice(-6).toUpperCase()}</h3>
                        <form onSubmit={handleRefund}>
                            <div className="form-group">
                                <label>Refund Status</label>
                                <select className="form-control" value={refundForm.refundStatus} onChange={e => setRefundForm({ ...refundForm, refundStatus: e.target.value })}>
                                    <option value="REQUESTED">Requested</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Refund Reason</label>
                                <textarea className="form-control" rows={2} value={refundForm.refundReason} onChange={e => setRefundForm({ ...refundForm, refundReason: e.target.value })} placeholder="Why is this being refunded?" required />
                            </div>
                            <div className="form-group">
                                <label>Refund Amount (₹) — Default: ₹{refundModal.totalAmount}</label>
                                <input className="form-control" type="number" value={refundForm.refundAmount} onChange={e => setRefundForm({ ...refundForm, refundAmount: e.target.value })} placeholder={refundModal.totalAmount} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-danger" type="submit">Process Refund</button>
                                <button className="btn btn-secondary" type="button" onClick={() => setRefundModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3>Order Details #{selectedOrder.id?.slice(-6).toUpperCase()}</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedOrder(null)}>✕ Close</button>
                        </div>
                        <div className="grid grid-2" style={{ gap: 20 }}>
                            <div>
                                <h4 style={{ marginBottom: 8, color: 'var(--primary)' }}>Customer Info</h4>
                                <p><strong>Name:</strong> {selectedOrder.user?.name}</p>
                                <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
                                <p><strong>Phone:</strong> {selectedOrder.shippingPhone}</p>
                            </div>
                            <div>
                                <h4 style={{ marginBottom: 8, color: 'var(--primary)' }}>Shipping Address</h4>
                                <p>{selectedOrder.shippingName}</p>
                                <p>{selectedOrder.shippingStreet}</p>
                                <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState}</p>
                                <p>PIN: {selectedOrder.shippingPincode}</p>
                            </div>
                        </div>

                        <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid var(--border)' }} />

                        {/* Shipment Tracking Section */}
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 20 }}>
                            <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FiTruck style={{ color: 'var(--info)' }} /> Shipment Tracking</h4>
                            {selectedOrder.trackingNumber ? (
                                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                    <div><strong>Carrier:</strong> {selectedOrder.carrier || '—'}</div>
                                    <div><strong>Tracking #:</strong> {selectedOrder.trackingNumber}</div>
                                    {selectedOrder.trackingUrl && (
                                        <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--info)' }}>
                                            🔗 Track Package
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-3" style={{ gap: 12 }}>
                                    <input className="form-control" placeholder="Carrier (e.g. Delhivery)" value={trackingForm.carrier} onChange={e => setTrackingForm({ ...trackingForm, carrier: e.target.value })} />
                                    <input className="form-control" placeholder="Tracking Number" value={trackingForm.trackingNumber} onChange={e => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })} />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input className="form-control" placeholder="Tracking URL" value={trackingForm.trackingUrl} onChange={e => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })} style={{ flex: 1 }} />
                                        <button className="btn btn-primary btn-sm" onClick={() => handleTracking(selectedOrder.id)} disabled={!trackingForm.trackingNumber}>
                                            <FiTruck /> Save
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Refund Status */}
                        {selectedOrder.refundStatus && selectedOrder.refundStatus !== 'NONE' && (
                            <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
                                <h4 style={{ color: 'var(--danger)', marginBottom: 8 }}><FiXCircle /> Refund Information</h4>
                                <p><strong>Status:</strong> <span className={`badge badge-${selectedOrder.refundStatus === 'COMPLETED' ? 'delivered' : 'pending'}`}>{selectedOrder.refundStatus?.toLowerCase()}</span></p>
                                {selectedOrder.refundReason && <p><strong>Reason:</strong> {selectedOrder.refundReason}</p>}
                                {selectedOrder.refundAmount > 0 && <p><strong>Amount:</strong> ₹{selectedOrder.refundAmount}</p>}
                            </div>
                        )}

                        <h4 style={{ marginBottom: 12 }}>Items</h4>
                        <table style={{ background: 'none' }}>
                            <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                            <tbody>
                                {selectedOrder.items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <h3 style={{ color: 'var(--primary)' }}>Total: ₹{selectedOrder.totalAmount}</h3>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <select className="form-control" style={{ flex: 1 }} value={selectedOrder.status} onChange={e => { updateStatus(selectedOrder.id, e.target.value); setSelectedOrder({ ...selectedOrder, status: e.target.value }); }}>
                                {statuses.map(s => <option key={s} value={s}>{s.toLowerCase()}</option>)}
                            </select>
                            <button className="btn btn-secondary" onClick={() => {
                                const win = window.open('', '_blank');
                                win.document.write(`
                                    <html>
                                    <head>
                                        <title>Invoice - ${selectedOrder.id?.slice(-6).toUpperCase()}</title>
                                        <style>
                                            body { font-family: sans-serif; padding: 40px; color: #333; }
                                            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e8751a; padding-bottom: 20px; }
                                            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 30px 0; }
                                            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                                            th { text-align: left; background: #f8f8f8; padding: 12px; border-bottom: 1px solid #ddd; }
                                            td { padding: 12px; border-bottom: 1px solid #eee; }
                                            .total { text-align: right; font-size: 1.4rem; color: #e8751a; font-weight: bold; }
                                            .footer { margin-top: 50px; text-align: center; color: #777; font-size: 0.9rem; }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="header">
                                            <div>
                                                <h1 style="color: #e8751a; margin: 0;">Sangam Namkeen</h1>
                                                <p>Authentic Traditional Taste</p>
                                            </div>
                                            <div style="text-align: right">
                                                <h2>INVOICE</h2>
                                                <p>Order ID: <strong>#${selectedOrder.id?.slice(-6).toUpperCase()}</strong></p>
                                                <p>Date: ${new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <div class="info-grid">
                                            <div>
                                                <h3>Billing/Shipping To:</h3>
                                                <p><strong>${selectedOrder.shippingName}</strong></p>
                                                <p>${selectedOrder.shippingStreet}</p>
                                                <p>${selectedOrder.shippingCity}, ${selectedOrder.shippingState} - ${selectedOrder.shippingPincode}</p>
                                                <p>Phone: ${selectedOrder.shippingPhone}</p>
                                            </div>
                                            <div style="text-align: right">
                                                <h3>Customer Information:</h3>
                                                <p>Name: ${selectedOrder.user?.name}</p>
                                                <p>Email: ${selectedOrder.user?.email}</p>
                                            </div>
                                        </div>
                                        <table>
                                            <thead><tr><th>Item Description</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                                            <tbody>
                                                ${selectedOrder.items.map(item => `
                                                    <tr>
                                                        <td>${item.name}</td>
                                                        <td>${item.quantity}</td>
                                                        <td>₹${item.price}</td>
                                                        <td>₹${item.price * item.quantity}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                        <div class="total">Total Amount: ₹${selectedOrder.totalAmount}</div>
                                        <div class="footer">
                                            <p>Thank you for choosing Sangam Namkeen!</p>
                                            <p>This is a computer-generated invoice.</p>
                                        </div>
                                        <script>window.print();</script>
                                    </body>
                                    </html>
                                `);
                                win.document.close();
                            }}>
                                🖨️ Print Invoice
                            </button>
                            {selectedOrder.status !== 'CANCELLED' && selectedOrder.refundStatus === 'NONE' && (
                                <button className="btn btn-danger" onClick={() => { setRefundModal(selectedOrder); setSelectedOrder(null); }}>
                                    <FiXCircle /> Refund / Cancel
                                </button>
                            )}
                            {selectedOrder.status !== 'CANCELLED' && (
                                <button className="btn btn-danger" style={{ background: 'var(--danger)' }} onClick={() => { updateStatus(selectedOrder.id, 'CANCELLED'); setSelectedOrder(null); }}>
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Refund</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id?.slice(-6).toUpperCase()}</td>
                                <td>{order.user?.name}<br /><small style={{ color: 'var(--text-muted)' }}>{order.user?.email}</small></td>
                                <td>{order.items?.length} items</td>
                                <td>₹{order.totalAmount}</td>
                                <td><span className={`badge badge-${order.status?.toLowerCase()}`}>{order.status?.toLowerCase()}</span></td>
                                <td>
                                    {order.refundStatus && order.refundStatus !== 'NONE' ? (
                                        <span className={`badge badge-${order.refundStatus === 'COMPLETED' ? 'delivered' : 'pending'}`}>
                                            {order.refundStatus?.toLowerCase()}
                                        </span>
                                    ) : '—'}
                                </td>
                                <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => setSelectedOrder(order)}>Details</button>
                                        <select className="form-control" value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                                            style={{ padding: '6px 10px', fontSize: '0.82rem', minWidth: 120 }}>
                                            {statuses.map(s => <option key={s} value={s}>{s.toLowerCase()}</option>)}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Users Management (Enhanced with Suspend) ───
function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');
    const [suspendModal, setSuspendModal] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');

    const loadUsers = useCallback(() => {
        let params = [];
        if (roleFilter) params.push(`role=${roleFilter}`);
        if (search) params.push(`search=${search}`);
        const queryString = params.length ? `?${params.join('&')}` : '';
        API.get(`/users${queryString}`).then(res => setUsers(res.data.users));
    }, [roleFilter, search]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const changeRole = async (id, role) => {
        await API.put(`/users/${id}/role`, { role });
        loadUsers();
    };

    const toggleStatus = async (id) => {
        await API.put(`/users/${id}/status`);
        loadUsers();
    };

    const handleSuspend = async () => {
        if (!suspendModal) return;
        await API.put(`/users/${suspendModal.id}/suspend`, { reason: suspendReason });
        setSuspendModal(null);
        setSuspendReason('');
        loadUsers();
    };

    const handleUnsuspend = async (id) => {
        await API.put(`/users/${id}/unsuspend`);
        loadUsers();
    };

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Users</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <input
                    className="form-control"
                    placeholder="Search name, email, phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 250 }}
                />
                <button className={`btn btn-sm ${!roleFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter('')}>All</button>
                <button className={`btn btn-sm ${roleFilter === 'user' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter('user')}>Users</button>
                <button className={`btn btn-sm ${roleFilter === 'staff' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter('staff')}>Staff</button>
                <button className={`btn btn-sm ${roleFilter === 'admin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter('admin')}>Admins</button>
            </div>

            {/* Suspend Modal */}
            {suspendModal && (
                <div className="modal-overlay" onClick={() => setSuspendModal(null)}>
                    <div className="card" style={{ width: '90%', maxWidth: 450 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16, color: 'var(--danger)' }}>🚫 Suspend User</h3>
                        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                            Suspending <strong>{suspendModal.name}</strong> ({suspendModal.email}). They will not be able to log in or place orders.
                        </p>
                        <div className="form-group">
                            <label>Reason for Suspension</label>
                            <textarea className="form-control" rows={3} value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="e.g. Fraudulent activity, policy violation..." required />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-danger" onClick={handleSuspend} disabled={!suspendReason}>Suspend User</button>
                            <button className="btn btn-secondary" onClick={() => setSuspendModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={u.isSuspended ? { background: 'rgba(239,68,68,0.05)' } : {}}>
                                <td>
                                    <strong>{u.name}</strong>
                                    {u.isSuspended && (
                                        <div style={{ marginTop: 4 }}>
                                            <span className="badge badge-cancelled" style={{ fontSize: '0.7rem' }}>🚫 SUSPENDED</span>
                                        </div>
                                    )}
                                </td>
                                <td>{u.email}</td>
                                <td>{u.phone || '—'}</td>
                                <td><span className={`badge badge-${u.role?.toLowerCase()}`}>{u.role?.toLowerCase()}</span></td>
                                <td><span style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)' }}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <select className="form-control" value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                                            style={{ padding: '6px 10px', fontSize: '0.82rem', minWidth: 90 }}>
                                            <option value="USER">User</option>
                                            <option value="STAFF">Staff</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                        <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(u.id)}>
                                            {u.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        {u.isSuspended ? (
                                            <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }} onClick={() => handleUnsuspend(u.id)}>
                                                Unsuspend
                                            </button>
                                        ) : (
                                            <button className="btn btn-sm" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => { setSuspendModal(u); setSuspendReason(''); }}>
                                                Suspend
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Attendance Management ───
function AdminAttendance() {
    const [staff, setStaff] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [view, setView] = useState('daily');
    const [stats, setStats] = useState([]);
    const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
    const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());

    const loadAttendance = useCallback(async () => {
        try {
            const res = await API.get(`/attendance/all?date=${selectedDate}`);
            setAttendance(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [selectedDate]);

    const loadStats = useCallback(async () => {
        try {
            const res = await API.get(`/attendance/stats?month=${summaryMonth}&year=${summaryYear}`);
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [summaryMonth, summaryYear]);

    useEffect(() => {
        API.get('/users?role=staff').then(res => setStaff(res.data.users));
    }, []);

    useEffect(() => {
        const fetchViewData = async () => {
            if (view === 'daily') await loadAttendance();
            else await loadStats();
        };
        fetchViewData();
    }, [view, loadAttendance, loadStats]);

    const markAttendance = async (userId, status) => {
        try {
            await API.post('/attendance/mark', { userId, date: selectedDate, status });
            loadAttendance();
        } catch {
            alert('Failed to mark attendance');
        }
    };

    const getStatus = (userId) => {
        const record = attendance.find(a => {
            const uid = typeof a.user === 'object' ? a.user?.id : a.user;
            return uid === userId;
        });
        return record ? record.status : 'not-marked';
    };

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Attendance Management</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className={`btn ${view === 'daily' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('daily')}>Daily Marking</button>
                <button className={`btn ${view === 'summary' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('summary')}>Monthly Summary</button>
            </div>

            {view === 'daily' ? (
                <>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="form-group" style={{ maxWidth: 300 }}>
                            <label><FiCalendar /> Select Date</label>
                            <input type="date" className="form-control" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead><tr><th>Staff Name</th><th>Status</th><th>Mark Attendance</th></tr></thead>
                            <tbody>
                                {staff.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.name}</td>
                                        <td>
                                            <span className={`badge badge-${getStatus(s.id)}`}>
                                                {getStatus(s.id)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }} onClick={() => markAttendance(s.id, 'present')}>Present</button>
                                                <button className="btn btn-sm" style={{ background: 'var(--warning)', color: 'white' }} onClick={() => markAttendance(s.id, 'late')}>Late</button>
                                                <button className="btn btn-sm" style={{ background: 'var(--info)', color: 'white' }} onClick={() => markAttendance(s.id, 'half-day')}>Half-Day</button>
                                                <button className="btn btn-sm" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => markAttendance(s.id, 'absent')}>Absent</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Month</label>
                            <select className="form-control" value={summaryMonth} onChange={e => setSummaryMonth(e.target.value)}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Year</label>
                            <input type="number" className="form-control" value={summaryYear} onChange={e => setSummaryYear(e.target.value)} />
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Staff Name</th>
                                    <th style={{ textAlign: 'center' }}>Present</th>
                                    <th style={{ textAlign: 'center' }}>Late</th>
                                    <th style={{ textAlign: 'center' }}>Half-Day</th>
                                    <th style={{ textAlign: 'center' }}>Absent</th>
                                    <th style={{ textAlign: 'center' }}>Total Records</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map(s => (
                                    <tr key={s.userId}>
                                        <td><strong>{s.name}</strong><br /><small>{s.email}</small></td>
                                        <td style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>{s.present}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--warning)', fontWeight: 600 }}>{s.late}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--info)', fontWeight: 600 }}>{s.halfDay}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>{s.absent}</td>
                                        <td style={{ textAlign: 'center' }}>{s.present + s.late + s.halfDay + s.absent}</td>
                                    </tr>
                                ))}
                                {stats.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>No attendance records found for this period.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Admin Reviews ───
function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [analytics, setAnalytics] = useState({ topRated: [], mostBought: [] });
    const [filter, setFilter] = useState('');
    const [replyModal, setReplyModal] = useState(null);
    const [replyText, setReplyText] = useState('');

    const loadReviews = useCallback(async () => {
        const res = await API.get(`/reviews/admin${filter ? `?product=${filter}` : ''}`);
        setReviews(res.data);
    }, [filter]);

    const loadAnalytics = useCallback(async () => {
        const res = await API.get('/reviews/analytics/highlights');
        setAnalytics(res.data);
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        loadReviews();
        loadAnalytics();
    }, [loadReviews, loadAnalytics]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleReply = async (e) => {
        e.preventDefault();
        try {
            await API.patch(`/reviews/${replyModal._id}/reply`, { reply: replyText });
            setReplyModal(null);
            setReplyText('');
            loadReviews();
        } catch {
            alert('Failed to send reply');
        }
    };

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Customer Reviews & Analytics</h2>

            {/* Analytics Highlights */}
            <div className="grid grid-2" style={{ gap: 24, marginBottom: 32 }}>
                <div className="card">
                    <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiStar style={{ color: 'var(--warning)' }} /> Best Rated Products</h3>
                    <div className="table-container" style={{ border: 'none' }}>
                        <table>
                            <thead><tr><th>Product</th><th>Rating</th><th>Reviews</th></tr></thead>
                            <tbody>
                                {analytics.topRated.map(p => (
                                    <tr key={p._id}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <img src={p.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                                            <span>{p.name}</span>
                                        </td>
                                        <td><strong style={{ color: 'var(--warning)' }}>{p.avgRating.toFixed(1)} ★</strong></td>
                                        <td>{p.reviewCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiShoppingBag style={{ color: 'var(--info)' }} /> Most Bought Highlights</h3>
                    <div className="table-container" style={{ border: 'none' }}>
                        <table>
                            <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
                            <tbody>
                                {analytics.mostBought.map(p => (
                                    <tr key={p._id}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <img src={p.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                                            <span>{p.name}</span>
                                        </td>
                                        <td><strong>{p.totalSold}</strong></td>
                                        <td>₹{p.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3>Recent Reviews</h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <select className="form-control" onChange={e => setFilter(e.target.value)} style={{ padding: '4px 12px', fontSize: '0.9rem' }}>
                            <option value="">All Products</option>
                            {[...new Set(reviews.map(r => r.product))].map(p => (
                                <option key={p?._id} value={p?._id}>{p?.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {reviews.map(r => (
                                <tr key={r._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <img src={r.product?.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{r.product?.name}</div>
                                                <small style={{ color: 'var(--text-muted)' }}>₹{r.product?.price}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{r.user?.name}</div>
                                        <small style={{ color: 'var(--text-muted)' }}>{r.user?.phone}</small>
                                    </td>
                                    <td>
                                        <div style={{ color: 'var(--warning)', fontWeight: 600 }}>
                                            {Array.from({ length: r.rating }).map((_, i) => <FiStar key={i} style={{ fill: 'currentColor' }} />)}
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: 250 }}>
                                        <div style={{ fontSize: '0.9rem' }}>"{r.comment}"</div>
                                        {r.reply && (
                                            <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-secondary)', borderRadius: 4, borderLeft: '3px solid var(--primary)' }}>
                                                <small style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Admin Reply:</small>
                                                <span style={{ fontSize: '0.85rem' }}>{r.reply}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${r.reply ? 'badge-delivered' : 'badge-pending'}`}>
                                            {r.reply ? 'Replied' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-primary" onClick={() => { setReplyModal(r); setReplyText(r.reply || ''); }}>
                                            <FiMessageSquare /> {r.reply ? 'Edit Reply' : 'Reply'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {reviews.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>No reviews found matching criteria.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reply Modal */}
            {replyModal && (
                <div className="modal-overlay" onClick={() => setReplyModal(null)}>
                    <div className="card" style={{ width: '90%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16 }}>Reply to {replyModal.user?.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>"{replyModal.comment}"</p>
                        <form onSubmit={handleReply}>
                            <div className="form-group">
                                <label>Your Response</label>
                                <textarea 
                                    className="form-control" 
                                    rows={4} 
                                    value={replyText} 
                                    onChange={e => setReplyText(e.target.value)} 
                                    placeholder="Write your response here..." 
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-primary" type="submit">Send Reply</button>
                                <button className="btn btn-secondary" type="button" onClick={() => setReplyModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Admin Layout ───
export default function AdminPanel() {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/admin', icon: <FiGrid />, label: 'Dashboard' },
        { path: '/admin/products', icon: <FiBox />, label: 'Products' },
        { path: '/admin/categories', icon: <FiTag />, label: 'Categories' },
        { path: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
        { path: '/admin/users', icon: <FiUsers />, label: 'Users' },
        { path: '/admin/attendance', icon: <FiCalendar />, label: 'Attendance' },
        { path: '/admin/promotions', icon: <FiPercent />, label: 'Promotions' },
        { path: '/admin/banners', icon: <FiImage />, label: 'Banners' },
        { path: '/admin/notifications', icon: <FiBell />, label: 'Notifications' },
        { path: '/admin/cms', icon: <FiFileText />, label: 'CMS' },
        { path: '/admin/reviews', icon: <FiMessageSquare />, label: 'Reviews' },
        { path: '/profile', icon: <FiUser />, label: 'Profile' },
    ];

    return (
        <div className="panel-layout">
            <aside className="panel-sidebar">
                <div className="sidebar-title">🔑 Admin Panel</div>
                {navItems.map(item => (
                    <Link key={item.path} to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                        {item.icon} {item.label}
                    </Link>
                ))}
                <button className="nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', color: 'var(--danger)', marginTop: 20 }}
                    onClick={() => { logout(); navigate('/'); }}>
                    <FiLogOut /> Logout
                </button>
            </aside>
            <main className="panel-content">
                <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="attendance" element={<AdminAttendance />} />
                    <Route path="promotions" element={<Promotions />} />
                    <Route path="banners" element={<Banners />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="cms" element={<CMS />} />
                </Routes>
            </main>
        </div>
    );
}
