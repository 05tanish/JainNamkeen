import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../../api/axios';

export default function UserOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const orderPlaced = location.state?.orderPlaced;

    // Return Modal State
    const [returnModal, setReturnModal] = useState(null);
    const [refundReason, setRefundReason] = useState('');

    const fetchOrders = () => {
        API.get('/orders').then(res => {
            setOrders(res.data.orders);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/orders/${returnModal._id}/request-return`, { refundReason });
            setReturnModal(null);
            setRefundReason('');
            fetchOrders(); // Refresh orders to show updated status
        } catch (error) {
            alert(error.response?.data?.message || 'Error requesting return');
        }
    };

    if (loading) return <div className="page container"><div className="skeleton" style={{ height: 300 }} /></div>;

    return (
        <div className="page container animate-fadeIn">
            <div className="page-header">
                <h1>My Orders</h1>
                <p>Track and manage your orders</p>
            </div>

            {orderPlaced && (
                <div className="alert alert-success" style={{ marginBottom: 24 }}>
                    🎉 Order placed successfully! Your delicious namkeen is on the way.
                </div>
            )}

            {/* Return Modal */}
            {returnModal && (
                <div className="modal-overlay" onClick={() => setReturnModal(null)}>
                    <div className="card" style={{ width: '90%', maxWidth: 450 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16 }}>Return Order #{returnModal._id.slice(-6).toUpperCase()}</h3>
                        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                            Please tell us why you want to return this order. Our team will review your request.
                        </p>
                        <form onSubmit={handleReturnSubmit}>
                            <div className="form-group">
                                <label>Reason for Return</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    placeholder="e.g. Received wrong item, quality issue..."
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                <button className="btn btn-primary" type="submit" disabled={!refundReason.trim()}>Submit Request</button>
                                <button className="btn btn-secondary" type="button" onClick={() => setReturnModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here</p>
                    <Link to="/products" className="btn btn-primary">Shop Now</Link>
                </div>
            ) : (
                orders.map(order => (
                    <div key={order._id} className="card" style={{ marginBottom: 16, padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Order #{order._id.slice(-8).toUpperCase()}</p>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className={`badge badge-${order.status}`}>{order.status}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{order.totalAmount}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {order.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                    <span>🍿</span> {item.name || item.product?.name} × {item.quantity}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
                            {order.shippingAddress && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    📍 {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                </p>
                            )}

                            {/* Return Logic */}
                            <div>
                                {order.refundStatus && order.refundStatus !== 'none' ? (
                                    <span className={`badge badge-${order.refundStatus === 'completed' ? 'delivered' : 'pending'}`}>
                                        Return {order.refundStatus}
                                    </span>
                                ) : order.status === 'delivered' ? (
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setReturnModal(order)}
                                    >
                                        Return Order
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
