import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../hooks/useCart';

export default function Cart() {
    const { items, cartTotal, updateQuantity, removeFromCart, loading } = useCart();

    if (loading) {
        return (
            <div className="page container">
                <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius)' }} />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="page container animate-fadeIn">
                <div className="empty-state">
                    <div className="icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Add some delicious namkeen to your cart!</p>
                    <Link to="/products" className="btn btn-primary"><FiShoppingBag /> Shop Now</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page container animate-fadeIn">
            <div className="page-header">
                <h1>Shopping Cart</h1>
                <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
                {/* Cart Items */}
                <div>
                    {items.map(item => (
                        <div key={item.product?._id || item._id} className="card" style={{
                            display: 'flex', gap: 16, padding: 20, marginBottom: 12, alignItems: 'center'
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-surface)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem', overflow: 'hidden', flexShrink: 0
                            }}>
                                {(item.product?.images && item.product.images.length > 0) || item.product?.image ? (
                                    <img src={item.product?.images && item.product.images.length > 0 ? item.product.images[0].url : (item.product?.image?.startsWith('http') ? item.product.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${item.product?.image}`)} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : '🍿'}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ marginBottom: 4 }}>{item.product?.name || 'Product'}</h4>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.product?.weight}</p>
                                <p style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{item.product?.price || 0}</p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => updateQuantity(item.product?._id, item.quantity - 1)}
                                    style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}
                                >−</button>
                                <span style={{
                                    padding: '6px 14px', border: '1px solid var(--border)',
                                    fontWeight: 600, fontSize: '0.9rem', background: 'var(--bg-surface)'
                                }}>{item.quantity}</span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => updateQuantity(item.product?._id, item.quantity + 1)}
                                    style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
                                >+</button>
                            </div>

                            <div style={{ textAlign: 'right', minWidth: 80 }}>
                                <p style={{ fontWeight: 700, marginBottom: 4 }}>₹{(item.product?.price || 0) * item.quantity}</p>
                                <button
                                    onClick={() => removeFromCart(item.product?._id)}
                                    style={{ background: 'none', color: 'var(--danger)', fontSize: '1rem' }}
                                ><FiTrash2 /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="card" style={{ padding: 24, position: 'sticky', top: 100 }}>
                    <h3 style={{ marginBottom: 20 }}>Order Summary</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
                        <span>Subtotal ({items.length} items)</span>
                        <span>₹{cartTotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem', color: 'var(--success)' }}>
                        <span>Delivery</span>
                        <span>{cartTotal >= 500 ? 'FREE' : '₹40'}</span>
                    </div>
                    <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: 24 }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--primary-light)' }}>₹{cartTotal + (cartTotal >= 500 ? 0 : 40)}</span>
                    </div>
                    <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', padding: '14px' }}>
                        Proceed to Checkout
                    </Link>
                    <Link to="/products" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', marginTop: 8, padding: '12px' }}>
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
