import { useState, useEffect, useCallback } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FiGrid, FiShoppingBag, FiBox, FiLogOut, FiUser, FiCalendar, FiStar, FiMessageSquare } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

// ─── Staff Dashboard ───
function StaffDashboard() {
    const [stats, setStats] = useState({});

    useEffect(() => {
        API.get('/orders/stats').then(res => setStats(res.data));
    }, []);

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Staff Dashboard</h2>
            <div className="grid grid-3">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--info)' }}><FiShoppingBag /></div>
                    <div className="stat-info"><h3>{stats.totalOrders || 0}</h3><p>Total Orders</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>⏳</div>
                    <div className="stat-info"><h3>{stats.pendingOrders || 0}</h3><p>Pending</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>✓</div>
                    <div className="stat-info"><h3>{stats.deliveredOrders || 0}</h3><p>Delivered</p></div>
                </div>
            </div>
            <h3 style={{ margin: '32px 0 16px' }}>Recent Orders</h3>
            <div className="table-container">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                        {(stats.recentOrders || []).map(order => (
                            <tr key={order._id}>
                                <td>#{order._id.slice(-6).toUpperCase()}</td>
                                <td>{order.user?.name}</td>
                                <td>₹{order.totalAmount}</td>
                                <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Staff Orders ───
function StaffOrders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('');

    const loadOrders = useCallback(() => {
        const params = filter ? `?status=${filter}` : '';
        API.get(`/orders${params}`).then(res => setOrders(res.data.orders));
    }, [filter]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const updateStatus = async (id, status) => {
        await API.put(`/orders/${id}/status`, { status });
        loadOrders();
    };

    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Manage Orders</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('')}>All</button>
                {statuses.map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
                ))}
            </div>
            <div className="table-container">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Update</th></tr></thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td>#{order._id.slice(-6).toUpperCase()}</td>
                                <td>{order.user?.name}<br /><small style={{ color: 'var(--text-muted)' }}>{order.user?.phone}</small></td>
                                <td>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={{ fontSize: '0.82rem' }}>{item.name} × {item.quantity}</div>
                                    ))}
                                </td>
                                <td>₹{order.totalAmount}</td>
                                <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                                <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                <td>
                                    <select className="form-control" value={order.status} onChange={e => updateStatus(order._id, e.target.value)}
                                        style={{ padding: '6px 10px', fontSize: '0.82rem', minWidth: 120 }}>
                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Staff Products View ───
function StaffProducts() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        API.get('/products/all').then(res => setProducts(res.data));
    }, []);

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Products Overview</h2>
            <div className="table-container">
                <table>
                    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p._id}>
                                <td><strong>{p.name}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{p.weight}</small></td>
                                <td>{p.category?.name}</td>
                                <td>₹{p.price}</td>
                                <td><span style={{ color: p.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>{p.stock}</span></td>
                                <td>{p.isActive ? <span style={{ color: 'var(--success)' }}>Active</span> : <span style={{ color: 'var(--danger)' }}>Inactive</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Staff Attendance ───
function StaffAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const loadAttendance = useCallback(async () => {
        try {
            const res = await API.get(`/attendance/me?month=${selectedMonth}&year=${selectedYear}`);
            setAttendance(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [selectedMonth, selectedYear]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>My Attendance</h2>
            <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Month</label>
                    <select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Year</label>
                    <input type="number" className="form-control" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Date</th><th>Status</th><th>Marked By</th></tr></thead>
                    <tbody>
                        {attendance.map(a => (
                            <tr key={a._id}>
                                <td>{new Date(a.date).toLocaleDateString()}</td>
                                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                                <td>{a.markedBy?.name}</td>
                            </tr>
                        ))}
                        {attendance.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No records found</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Staff Reviews (Read Only) ───
function StaffReviews() {
    const [reviews, setReviews] = useState([]);
    const [filter, setFilter] = useState('');

    const loadReviews = useCallback(async () => {
        try {
            const res = await API.get(`/reviews/admin${filter ? `?product=${filter}` : ''}`);
            setReviews(res.data);
        } catch {
            // Silently fail or handled by interceptor
        }
    }, [filter]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        loadReviews();
    }, [loadReviews]);
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
        <div className="animate-fadeIn">
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Customer Reviews (Read Only)</h2>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3>Feedback from Customers</h3>
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
                        <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Status</th></tr></thead>
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
                                    <td>{r.user?.name}</td>
                                    <td>
                                        <div style={{ color: 'var(--warning)', fontWeight: 600 }}>
                                            {Array.from({ length: r.rating }).map((_, i) => <FiStar key={i} style={{ fill: 'currentColor' }} />)}
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: 300 }}>
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
                                            {r.reply ? 'Replied' : 'No Reply'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {reviews.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24 }}>No reviews found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Staff Layout ───
export default function StaffPanel() {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/staff', icon: <FiGrid />, label: 'Dashboard' },
        { path: '/staff/orders', icon: <FiShoppingBag />, label: 'Orders' },
        { path: '/staff/products', icon: <FiBox />, label: 'Products' },
        { path: '/staff/attendance', icon: <FiCalendar />, label: 'Attendance' },
        { path: '/staff/reviews', icon: <FiMessageSquare />, label: 'Reviews' },
        { path: '/profile', icon: <FiUser />, label: 'Profile' },
    ];

    return (
        <div className="panel-layout">
            <aside className="panel-sidebar">
                <div className="sidebar-title">👤 Staff Panel</div>
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
                    <Route index element={<StaffDashboard />} />
                    <Route path="orders" element={<StaffOrders />} />
                    <Route path="products" element={<StaffProducts />} />
                    <Route path="attendance" element={<StaffAttendance />} />
                    <Route path="reviews" element={<StaffReviews />} />
                </Routes>
            </main>
        </div>
    );
}
