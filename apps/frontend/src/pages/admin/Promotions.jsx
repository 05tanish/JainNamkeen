import { useState, useEffect, useCallback } from 'react';
import { FiPercent, FiZap, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import API from '../../api/axios';

// ─── Coupons Tab ───
function CouponsTab() {
    const [coupons, setCoupons] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '',
        maxDiscount: '', validUntil: '', usageLimit: ''
    });

    const loadCoupons = useCallback(() => {
        API.get('/coupons').then(res => setCoupons(res.data));
    }, []);

    useEffect(() => { loadCoupons(); }, [loadCoupons]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { ...form };
        if (!data.maxDiscount) delete data.maxDiscount;
        if (!data.usageLimit) delete data.usageLimit;

        if (editing) await API.put(`/coupons/${editing}`, data);
        else await API.post('/coupons', data);

        setShowForm(false);
        setEditing(null);
        setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', validUntil: '', usageLimit: '' });
        loadCoupons();
    };

    const handleEdit = (c) => {
        setForm({
            code: c.code, discountType: c.discountType, discountValue: c.discountValue,
            minOrderAmount: c.minOrderAmount || '', maxDiscount: c.maxDiscount || '',
            validUntil: c.validUntil ? c.validUntil.split('T')[0] : '', usageLimit: c.usageLimit || ''
        });
        setEditing(c._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this coupon?')) { await API.delete(`/coupons/${id}`); loadCoupons(); }
    };

    const handleToggle = async (id) => {
        await API.put(`/coupons/${id}/toggle`);
        loadCoupons();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3><FiPercent /> Coupons</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', validUntil: '', usageLimit: '' }); }}>
                    {showForm ? 'Cancel' : <><FiPlus /> Create Coupon</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="grid grid-3">
                        <div className="form-group">
                            <label>Coupon Code</label>
                            <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" required />
                        </div>
                        <div className="form-group">
                            <label>Discount Type</label>
                            <select className="form-control" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat (₹)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Discount Value</label>
                            <input className="form-control" type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Min Order Amount (₹)</label>
                            <input className="form-control" type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Max Discount (₹)</label>
                            <input className="form-control" type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="Optional" />
                        </div>
                        <div className="form-group">
                            <label>Valid Until</label>
                            <input className="form-control" type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Usage Limit</label>
                            <input className="form-control" type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
                        </div>
                    </div>
                    <button className="btn btn-primary">{editing ? 'Update' : 'Create'} Coupon</button>
                </form>
            )}

            <div className="table-container">
                <table>
                    <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Valid Until</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {coupons.map(c => (
                            <tr key={c._id}>
                                <td><strong style={{ color: 'var(--primary)', letterSpacing: 1 }}>{c.code}</strong></td>
                                <td><span className="badge badge-confirmed">{c.discountType}</span></td>
                                <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                                <td>₹{c.minOrderAmount || 0}</td>
                                <td>{new Date(c.validUntil).toLocaleDateString('en-IN')}</td>
                                <td>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                                <td>
                                    <span style={{ color: c.isActive ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                        {c.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                                        <button className="btn btn-sm" style={{ background: c.isActive ? 'var(--warning)' : 'var(--success)', color: 'white' }} onClick={() => handleToggle(c._id)}>
                                            {c.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No coupons yet. Create your first coupon above.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Flash Sales Tab ───
function FlashSalesTab() {
    const [products, setProducts] = useState([]);
    const [flashProducts, setFlashProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [flashPrice, setFlashPrice] = useState('');
    const [flashEnd, setFlashEnd] = useState('');

    useEffect(() => {
        API.get('/products/all').then(res => {
            setProducts(res.data);
            setFlashProducts(res.data.filter(p => p.flashSalePrice && new Date(p.flashSaleEnd) > new Date()));
        });
    }, []);

    const addFlashSale = async (e) => {
        e.preventDefault();
        if (!selectedProduct || !flashPrice || !flashEnd) return;
        await API.put(`/products/${selectedProduct}`, { flashSalePrice: flashPrice, flashSaleEnd: flashEnd });
        // Refresh
        const res = await API.get('/products/all');
        setProducts(res.data);
        setFlashProducts(res.data.filter(p => p.flashSalePrice && new Date(p.flashSaleEnd) > new Date()));
        setSelectedProduct(''); setFlashPrice(''); setFlashEnd('');
    };

    const removeFlashSale = async (id) => {
        await API.put(`/products/${id}`, { flashSalePrice: null, flashSaleEnd: null });
        const res = await API.get('/products/all');
        setProducts(res.data);
        setFlashProducts(res.data.filter(p => p.flashSalePrice && new Date(p.flashSaleEnd) > new Date()));
    };

    return (
        <div>
            <h3 style={{ marginBottom: 20 }}><FiZap style={{ color: 'var(--warning)' }} /> Flash Sales</h3>

            <form onSubmit={addFlashSale} className="card" style={{ marginBottom: 24 }}>
                <div className="grid grid-3">
                    <div className="form-group">
                        <label>Select Product</label>
                        <select className="form-control" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
                            <option value="">Choose product...</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Flash Sale Price (₹)</label>
                        <input className="form-control" type="number" value={flashPrice} onChange={e => setFlashPrice(e.target.value)} placeholder="Discounted price" required />
                    </div>
                    <div className="form-group">
                        <label>Sale Ends</label>
                        <input className="form-control" type="datetime-local" value={flashEnd} onChange={e => setFlashEnd(e.target.value)} required />
                    </div>
                </div>
                <button className="btn btn-primary"><FiZap /> Start Flash Sale</button>
            </form>

            <div className="table-container">
                <table>
                    <thead><tr><th>Product</th><th>Original Price</th><th>Flash Price</th><th>Discount</th><th>Ends</th><th>Actions</th></tr></thead>
                    <tbody>
                        {flashProducts.map(p => (
                            <tr key={p._id}>
                                <td><strong>{p.name}</strong></td>
                                <td style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{p.price}</td>
                                <td style={{ color: 'var(--danger)', fontWeight: 700 }}>₹{p.flashSalePrice}</td>
                                <td><span className="badge badge-cancelled">{Math.round((1 - p.flashSalePrice / p.price) * 100)}% OFF</span></td>
                                <td>{new Date(p.flashSaleEnd).toLocaleString('en-IN')}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={() => removeFlashSale(p._id)}>End Sale</button></td>
                            </tr>
                        ))}
                        {flashProducts.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No active flash sales.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Main Promotions Page ───
export default function Promotions() {
    const [tab, setTab] = useState('coupons');

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Promotions & Marketing</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button className={`btn btn-sm ${tab === 'coupons' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('coupons')}>
                    <FiPercent /> Coupons
                </button>
                <button className={`btn btn-sm ${tab === 'flash' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('flash')}>
                    <FiZap /> Flash Sales
                </button>
            </div>

            {tab === 'coupons' && <CouponsTab />}
            {tab === 'flash' && <FlashSalesTab />}
        </div>
    );
}
