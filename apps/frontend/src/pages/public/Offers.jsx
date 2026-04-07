import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { FiTag, FiClock, FiShoppingBag, FiInfo } from 'react-icons/fi';

export default function Offers() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/coupons/active')
            .then(res => {
                setCoupons(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        alert(`Coupon code ${code} copied to clipboard!`);
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    return (
        <main className="container animate-fadeIn" style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <FiTag /> Special Offers & Coupons
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Discover amazing deals and save on your favorite authentic Indian snacks.</p>
            </div>

            <div className="grid grid-2">
                {coupons.map(coupon => (
                    <div key={coupon._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '2px dashed var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--card-hover)', position: 'absolute', top: 0, right: 0, padding: '8px 16px', borderBottomLeftRadius: 12, fontWeight: 600, color: 'var(--success)' }}>
                            Active
                        </div>

                        <div style={{ paddingRight: 60 }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--text-primary)' }}>
                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FiShoppingBag /> Valid on orders above ₹{coupon.minOrderAmount}
                            </p>
                            {coupon.maxDiscount && (
                                <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <FiInfo /> Maximum discount of ₹{coupon.maxDiscount}
                                </p>
                            )}
                            <p style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <FiClock /> Expires: {new Date(coupon.validUntil).toLocaleDateString()}
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', background: 'var(--surface-color)', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: 2 }}>
                                {coupon.code}
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => copyToClipboard(coupon.code)}>
                                Copy Code
                            </button>
                        </div>
                    </div>
                ))}

                {coupons.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, background: 'var(--surface-color)', borderRadius: 12 }}>
                        <FiTag size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                        <h3>No Active Offers Right Now</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Keep an eye out for our upcoming festive discounts and flash sales!</p>
                    </div>
                )}
            </div>
        </main>
    );
}
