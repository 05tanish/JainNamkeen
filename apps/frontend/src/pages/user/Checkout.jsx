import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useCart } from '../../hooks/useCart';
import { useAlert } from '../../components/AlertManager';
import './Checkout.css';

// Lazy load Calendar component
const Calendar = lazy(() => import('@heroui/react').then(module => ({ default: module.Calendar })));

export default function Checkout() {
    const navigate = useNavigate();
    const { items, cartTotal, clearCart } = useCart();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        paymentMethod: 'cod'
    });

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [activeCoupons, setActiveCoupons] = useState([]);

    // Delivery date state
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 3); // Default to 3 days from now
        return date;
    });

    // Memoize min and max dates to prevent recalculation
    const minDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 3); // Minimum 3 days
        return date;
    }, []);

    const maxDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30); // Maximum 30 days
        return date;
    }, []);

    useEffect(() => {
        API.get('/coupons/active').then(res => setActiveCoupons(res.data)).catch(() => {});
    }, []);

    // Memoize delivery charge calculation
    const deliveryCharge = useMemo(() => {
        return cartTotal >= 500 ? 0 : 40;
    }, [cartTotal]);
    
    // Memoize discount calculation
    const discount = useMemo(() => {
        if (!appliedCoupon) return 0;
        
        if (appliedCoupon.discountType === 'fixed') {
            return appliedCoupon.discountValue;
        } else if (appliedCoupon.discountType === 'percentage') {
            let calculatedDiscount = (cartTotal * appliedCoupon.discountValue) / 100;
            if (appliedCoupon.maxDiscount) {
                calculatedDiscount = Math.min(calculatedDiscount, appliedCoupon.maxDiscount);
            }
            return calculatedDiscount;
        }
        return 0;
    }, [appliedCoupon, cartTotal]);
    
    // Memoize total calculation
    const total = useMemo(() => {
        return Math.max(0, cartTotal + deliveryCharge - discount);
    }, [cartTotal, deliveryCharge, discount]);

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        setCouponError('');
        const coupon = activeCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
        
        if (!coupon) {
            const errorMsg = 'Invalid or expired coupon code';
            setCouponError(errorMsg);
            setAppliedCoupon(null);
            showAlert(errorMsg, 'error');
            return;
        }
        
        if (cartTotal < (coupon.minOrderAmount || 0)) {
            const errorMsg = `Minimum order amount of ₹${coupon.minOrderAmount} required`;
            setCouponError(errorMsg);
            setAppliedCoupon(null);
            showAlert(errorMsg, 'error');
            return;
        }
        
        setAppliedCoupon(coupon);
        setCouponCode('');
        showAlert(`Coupon ${coupon.code} applied successfully!`, 'success');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const orderData = {
                items: items.map(item => ({
                    product: item.product?._id,
                    name: item.product?.name,
                    price: item.product?.price,
                    quantity: item.quantity
                })),
                totalAmount: total,
                shippingAddress: {
                    name: form.name,
                    phone: form.phone,
                    street: form.street,
                    city: form.city,
                    state: form.state,
                    pincode: form.pincode
                },
                paymentMethod: form.paymentMethod,
                couponCode: appliedCoupon?.code || null,
                deliveryDate: deliveryDate.toISOString()
            };

            await API.post('/orders', orderData);
            await clearCart();
            showAlert('Order placed successfully! Redirecting...', 'success');
            setTimeout(() => {
                navigate('/my-orders', { state: { orderPlaced: true } });
            }, 1000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to place order. Please try again.';
            showAlert(errorMsg, 'error', 0); // 0 duration = no auto-dismiss for critical errors
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="page container animate-fadeIn">
                <div className="empty-state">
                    <div className="icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Add items to your cart before checkout</p>
                    <Link to="/products" className="btn btn-primary">Shop Now</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page container animate-fadeIn">
            <div className="page-header">
                <h1>Checkout</h1>
                <p>Complete your order</p>
            </div>

            <div className="checkout-layout">
                <form onSubmit={handleSubmit}>
                    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 20 }}>Shipping Address</h3>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="form-control" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input className="form-control" value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input className="form-control" value={form.street}
                                onChange={e => setForm({ ...form, street: e.target.value })} required />
                        </div>
                        <div className="grid grid-3">
                            <div className="form-group">
                                <label>City</label>
                                <input className="form-control" value={form.city}
                                    onChange={e => setForm({ ...form, city: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input className="form-control" value={form.state}
                                    onChange={e => setForm({ ...form, state: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Pincode</label>
                                <input className="form-control" value={form.pincode}
                                    onChange={e => setForm({ ...form, pincode: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>Payment Method</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 8, background: form.paymentMethod === 'cod' ? 'var(--primary-glow)' : 'transparent' }}>
                            <input type="radio" name="payment" value="cod" checked={form.paymentMethod === 'cod'}
                                onChange={() => setForm({ ...form, paymentMethod: 'cod' })} />
                            <span>💵 Cash on Delivery (COD)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 12, borderRadius: 'var(--radius-sm)', background: form.paymentMethod === 'online' ? 'var(--primary-glow)' : 'transparent' }}>
                            <input type="radio" name="payment" value="online" checked={form.paymentMethod === 'online'}
                                onChange={() => setForm({ ...form, paymentMethod: 'online' })} />
                            <span>💳 Online Payment (Coming Soon)</span>
                        </label>
                    </div>

                    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>Preferred Delivery Date</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                            Select your preferred delivery date (3-30 days from today)
                        </p>
                        <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}>Loading calendar...</div>}>
                            <Calendar
                                value={deliveryDate}
                                onChange={setDeliveryDate}
                                minDate={minDate}
                                maxDate={maxDate}
                                color="primary"
                                showMonthAndYearPickers
                                style={{ maxWidth: 400 }}
                            />
                        </Suspense>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 12 }}>
                            Selected: {deliveryDate.toLocaleDateString('en-IN', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                        {loading ? 'Placing Order...' : `Place Order — ₹${total}`}
                    </button>
                </form>

                {/* Order Summary */}
                <div className="card order-summary-card" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 20 }}>Order Summary</h3>
                    {items.map(item => (
                        <div key={item.product?._id || item._id} style={{
                            display: 'flex', justifyContent: 'space-between', marginBottom: 10,
                            fontSize: '0.88rem', paddingBottom: 8
                        }}>
                            <span>{item.product?.name} × {item.quantity}</span>
                            <span style={{ fontWeight: 600 }}>₹{(item.product?.price || 0) * item.quantity}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.9rem' }}>
                        <span>Subtotal</span>
                        <span>₹{cartTotal}</span>
                    </div>
                    {discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.9rem', color: 'var(--success)' }}>
                            <span>Discount ({appliedCoupon.code})</span>
                            <span>-₹{discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.9rem', color: 'var(--success)' }}>
                        <span>Delivery</span>
                        <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                    </div>
                    <hr style={{ border: '0', borderTop: '1px solid var(--outline-variant)', margin: '16px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--primary-light)' }}>₹{total.toFixed(2)}</span>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Apply Coupon</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Enter code" 
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                style={{ flex: 1, textTransform: 'uppercase' }}
                            />
                            <button className="btn btn-secondary" onClick={handleApplyCoupon} style={{ padding: '0 16px' }}>Apply</button>
                        </div>
                        {couponError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 8 }}>{couponError}</div>}
                        {appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: 'var(--radius-sm)', marginTop: 12, border: '1px solid var(--success)' }}>
                                <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>{appliedCoupon.code} applied!</span>
                                <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                            </div>
                        )}
                        
                        {activeCoupons.length > 0 && !appliedCoupon && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Available Coupons:</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {activeCoupons.map(c => (
                                        <span key={c._id} 
                                            onClick={() => setCouponCode(c.code)}
                                            style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--surface-container-highest)', border: '1px dashed var(--primary-light)', borderRadius: 4, cursor: 'pointer', color: 'var(--primary)' }}>
                                            {c.code}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
