import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiGrid, FiShoppingBag, FiBell } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useState, useEffect } from 'react';
import API from '../api/axios';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);

    useEffect(() => {
        if (user) {
            API.get('/notifications/user').then(res => setNotifications(res.data)).catch(() => { });
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileOpen(false);
    };

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'staff') return '/staff';
        return '/my-orders';
    };

    return (
        <nav className="navbar glass">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">🍿</span>
                    <span className="brand-text">Sangam <span className="brand-highlight">Namkeen</span></span>
                </Link>

                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
                    <Link to="/products" onClick={() => setMobileOpen(false)}>Products</Link>
                    <Link to="/offers" onClick={() => setMobileOpen(false)}>Offers & Coupons</Link>
                    <Link to="/pages/about-us" onClick={() => setMobileOpen(false)}>About</Link>

                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="mobile-only">
                        Profile
                    </Link>
                    {user && (
                        <Link to={getDashboardLink()} onClick={() => setMobileOpen(false)} className="mobile-only">
                            {user.role === 'admin' ? 'Admin Panel' : user.role === 'staff' ? 'Staff Panel' : 'My Orders'}
                        </Link>
                    )}

                    {user ? (
                        <button className="mobile-only logout-link" onClick={handleLogout}>Logout</button>
                    ) : (
                        <Link to="/login" onClick={() => setMobileOpen(false)} className="mobile-only">Login</Link>
                    )}
                </div>

                <div className="navbar-actions">
                    {user && (
                        <div style={{ position: 'relative' }}>
                            <button className="cart-btn" onClick={() => setShowNotif(!showNotif)} title="Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
                                <FiBell size={20} />
                                {notifications.length > 0 && <span className="cart-badge">{notifications.length}</span>}
                            </button>
                            {showNotif && (
                                <div className="card animate-fadeIn" style={{ position: 'absolute', top: '100%', right: 0, width: 300, padding: '16px 0', zIndex: 100, marginTop: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                                        <h4 style={{ margin: 0 }}>Notifications</h4>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    API.put('/notifications/user/read-all')
                                                        .then(() => setNotifications([]))
                                                        .catch(err => console.error(err));
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                Read All
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                        {notifications.map(n => (
                                            <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                                                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--primary)', marginBottom: 4 }}>{n.title}</strong>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.body}</span>
                                                <small style={{ display: 'block', marginTop: 8, color: 'var(--text-muted)' }}>{new Date(n.sentAt).toLocaleDateString()}</small>
                                            </div>
                                        ))}
                                        {notifications.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No new notifications</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {user && user.role === 'user' && (
                        <Link to="/cart" className="cart-btn" title="Cart">
                            <FiShoppingCart />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                    )}

                    {user ? (
                        <div className="user-menu">
                            <Link to="/profile" className="user-btn" title="Profile">
                                <FiUser />
                            </Link>
                            <Link to={getDashboardLink()} className="user-btn" title={user.role === 'admin' ? 'Dashboard' : 'My Orders'}>
                                {user.role === 'admin' ? <FiMenu /> : user.role === 'staff' ? <FiGrid /> : <FiShoppingBag />}
                            </Link>
                            <button className="btn btn-sm btn-secondary desktop-only" onClick={handleLogout}>
                                <FiLogOut size={14} /> Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-sm btn-primary">Login</Link>
                    )}

                    <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
