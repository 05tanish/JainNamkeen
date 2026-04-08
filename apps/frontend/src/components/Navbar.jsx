import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiGrid, FiShoppingBag, FiBell, FiPackage } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        if (user) {
            API.get('/notifications/user').then(r => setNotifications(r.data)).catch(() => {});
        }
    }, [user]);

    // Close notif dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleLogout = () => { logout(); navigate('/'); };

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'staff') return '/staff';
        return '/my-orders';
    };

    const isActive = (path) => location.pathname === path ? 'active-link' : '';

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                {/* Brand */}
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">🍿</span>
                    <span className="brand-text">Jain <span className="brand-highlight">Namkeen</span></span>
                </Link>

                {/* Nav links */}
                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    <Link to="/" className={isActive('/')}>Home</Link>
                    <Link to="/products" className={isActive('/products')}>Products</Link>
                    <Link to="/offers" className={isActive('/offers')}>Offers</Link>
                    <Link to="/about" className={isActive('/about')}>About</Link>

                    {/* Mobile-only extras */}
                    {user && (
                        <>
                            <Link to="/profile" className="mobile-only">Profile</Link>
                            <Link to={getDashboardLink()} className="mobile-only">
                                {user.role === 'admin' ? 'Admin Panel' : user.role === 'staff' ? 'Staff Panel' : 'My Orders'}
                            </Link>
                            <button
                                className="mobile-only"
                                onClick={handleLogout}
                                style={{ background: 'none', color: 'var(--danger)', fontWeight: 600, fontSize: '1rem', padding: '13px 18px', textAlign: 'left', borderRadius: 'var(--radius-sm)' }}
                            >
                                Logout
                            </button>
                        </>
                    )}
                    {!user && (
                        <Link to="/login" className="mobile-only">Login</Link>
                    )}
                </div>

                {/* Actions */}
                <div className="navbar-actions">
                    {/* Notifications */}
                    {user && (
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            <button
                                className="nav-icon-btn"
                                onClick={() => setShowNotif(v => !v)}
                                title="Notifications"
                            >
                                <FiBell size={18} />
                                {notifications.length > 0 && (
                                    <span className="nav-badge">{notifications.length > 9 ? '9+' : notifications.length}</span>
                                )}
                            </button>

                            {showNotif && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <h4>Notifications</h4>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    API.put('/notifications/user/read-all')
                                                        .then(() => setNotifications([]))
                                                        .catch(() => {});
                                                }}
                                                style={{ background: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">
                                                <FiBell size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                                                No new notifications
                                            </div>
                                        ) : notifications.map(n => (
                                            <div key={n._id} className="notif-item">
                                                <div className="notif-title">{n.title}</div>
                                                <div className="notif-body">{n.body}</div>
                                                <div className="notif-time">{new Date(n.sentAt).toLocaleDateString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart */}
                    {user?.role === 'user' && (
                        <Link to="/cart" className="nav-icon-btn" title="Cart">
                            <FiShoppingCart size={18} />
                            {cartCount > 0 && <span className="nav-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
                        </Link>
                    )}

                    {/* Dashboard shortcut */}
                    {user && (
                        <Link to={getDashboardLink()} className="nav-icon-btn desktop-only" title="Dashboard">
                            {user.role === 'admin' ? <FiGrid size={18} /> : user.role === 'staff' ? <FiPackage size={18} /> : <FiShoppingBag size={18} />}
                        </Link>
                    )}

                    {/* User avatar / login */}
                    {user ? (
                        <>
                            <Link to="/profile" title="Profile" className="desktop-only">
                                <div className="user-avatar-btn">{initials}</div>
                            </Link>
                            <button
                                className="btn btn-sm btn-ghost desktop-only"
                                onClick={handleLogout}
                                style={{ gap: 6 }}
                            >
                                <FiLogOut size={14} /> Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-sm btn-primary desktop-only">Login</Link>
                    )}

                    {/* Mobile toggle */}
                    <button className="mobile-toggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
                        {mobileOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
