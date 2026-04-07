import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiArrowLeft, FiStar, FiEdit, FiTrash2 } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [mainImage, setMainImage] = useState('');

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', images: [] });
    const [editingReview, setEditingReview] = useState(null);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await API.get(`/reviews/product/${id}`);
            setReviews(res.data.reviews);
            setStats(res.data.stats);
        } catch (error) {
            console.error('Failed to load reviews', error);
        }
    }, [id]);

    useEffect(() => {
        API.get(`/products/${id}`).then(res => {
            setProduct(res.data);
            setLoading(false);
            
            const firstImage = (res.data.images && res.data.images.length > 0) ? res.data.images[0].url : res.data.image;
            setMainImage(firstImage);

            // Save to recently viewed
            try {
                const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const filtered = stored.filter(item => item._id !== res.data._id);
                filtered.unshift({
                    _id: res.data._id,
                    name: res.data.name,
                    price: res.data.price,
                    image: firstImage,
                });
                localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, 10)));
            } catch { /* ignore */ }
        }).catch(() => {
            setLoading(false);
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchReviews();
    }, [id, fetchReviews]);

    const handleAddToCart = async () => {
        if (!user) {
            window.location.assign('/login');
            return;
        }
        for (let i = 0; i < quantity; i++) {
            await addToCart(product._id);
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('rating', reviewForm.rating);
            formData.append('comment', reviewForm.comment);

            // Append new images
            if (reviewForm.images) {
                Array.from(reviewForm.images).forEach(file => {
                    formData.append('images', file);
                });
            }

            if (editingReview) {
                // If editing, we also need to pass existing images that weren't deleted
                reviewForm.existingImages?.forEach(img => formData.append('existingImages', img));
                await API.put(`/reviews/${editingReview}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await API.post(`/reviews/product/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            setReviewForm({ rating: 5, comment: '', images: [] });
            setShowReviewForm(false);
            setEditingReview(null);
            fetchReviews();
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting review');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('Delete this review?')) return;
        try {
            await API.delete(`/reviews/${reviewId}`);
            fetchReviews();
        } catch {
            alert('Error deleting review');
        }
    };

    if (loading) {
        return (
            <div className="page container">
                <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius)' }} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="page container">
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <h3>Product not found</h3>
                    <Link to="/products" className="btn btn-primary">Back to Products</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page container animate-fadeIn">
            <button
                onClick={() => navigate(-1)}
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 32, padding: '8px 20px', borderRadius: '30px', fontSize: '0.9rem' }}
            >
                <FiArrowLeft /> Back to Shop
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
                {/* Image */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8rem',
                        border: '1px solid var(--border)',
                        position: 'relative'
                    }}>
                        {mainImage ? (
                            <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : '🍿'}
                    </div>
                    
                    {/* Thumbnails */}
                    {product.images && product.images.length > 1 && (
                        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                            {product.images.map((img, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setMainImage(img.url)}
                                    style={{
                                        width: 80, height: 80, flexShrink: 0,
                                        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                                        border: mainImage === img.url ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        cursor: 'pointer', opacity: mainImage === img.url ? 1 : 0.6,
                                        transition: 'all 0.2s'
                                    }}>
                                    <img src={img.url} alt={`${product.name} ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div style={{ padding: '20px 0' }}>
                    {product.category?.name && (
                        <span style={{
                            fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)',
                            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'inline-block',
                            background: 'rgba(255, 122, 0, 0.08)', padding: '6px 16px', borderRadius: 30, border: '1px solid rgba(255, 122, 0, 0.15)'
                        }}>
                            {product.category.name}
                        </span>
                    )}
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: 12, lineHeight: 1.1, color: 'var(--text-primary)' }}>{product.name}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: 24 }}>Net Weight: {product.weight}</p>

                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 24 }}>
                        ₹{product.price}
                    </div>

                    {product.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32 }}>
                            {product.description}
                        </p>
                    )}

                    {product.tags && product.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                            {product.tags.map(tag => (
                                <Link
                                    key={tag}
                                    to={`/products?tag=${tag}`}
                                    style={{
                                        fontSize: '0.78rem', padding: '4px 12px', borderRadius: 20,
                                        background: 'rgba(232,117,26,0.1)', color: 'var(--primary-light)',
                                        textTransform: 'capitalize', textDecoration: 'none'
                                    }}
                                >#{tag}</Link>
                            ))}
                        </div>
                    )}

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                        marginBottom: 32
                    }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Availability:</span>
                        <span style={{ color: product.stock > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '1.1rem' }}>
                            {product.stock > 0 ? `In Stock (${product.stock})` : 'Sold Out'}
                        </span>
                    </div>

                    {product.stock > 0 && (
                        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', borderRadius: '50px', border: '1px solid var(--border)' }}>
                                <button
                                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: 44, height: 44, fontSize: '1.2rem', cursor: 'pointer' }}
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >−</button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                                    style={{ width: 40, textAlign: 'center', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}
                                />
                                <button
                                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: 44, height: 44, fontSize: '1.2rem', cursor: 'pointer' }}
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                >+</button>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                style={{ flex: 1, padding: '0 32px', fontSize: '1.1rem' }}
                            >
                                <FiShoppingCart /> {added ? '✓ Added to Cart!' : 'Add to Cart'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div style={{ marginTop: 80, paddingTop: 60, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--primary)' }}>Customer Reviews</h2>
                    {user && !reviews.find(r => r.user?._id === user._id) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setShowReviewForm(!showReviewForm); setEditingReview(null); setReviewForm({ rating: 5, comment: '', images: [] }); }}>
                            {showReviewForm ? 'Cancel' : 'Write a Review'}
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 32, marginBottom: 40, alignItems: 'center', background: 'var(--bg-surface)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                        {stats.averageRating}
                        <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>/5</span>
                    </div>
                    <div>
                        <div style={{ display: 'flex', gap: 6, color: 'var(--primary-light)', fontSize: '1.4rem', marginBottom: 8 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <FiStar key={star} fill={star <= stats.averageRating ? 'var(--primary-light)' : 'none'} />
                            ))}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Based on {stats.totalReviews} reviews</div>
                    </div>
                </div>

                {showReviewForm && (
                    <form onSubmit={handleReviewSubmit} className="card animate-fadeIn" style={{ marginBottom: 40, background: 'var(--surface-color)' }}>
                        <h3 style={{ marginBottom: 16 }}>{editingReview ? 'Edit Your Review' : 'Write a Review'}</h3>

                        <div className="form-group">
                            <label>Rating</label>
                            <div style={{ display: 'flex', gap: 8, color: 'var(--primary)', fontSize: '1.5rem', cursor: 'pointer' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <FiStar
                                        key={star}
                                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                        fill={star <= reviewForm.rating ? 'var(--primary)' : 'none'}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Review Comment</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                value={reviewForm.comment}
                                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                required
                                placeholder="What did you like or dislike about this product?"
                            />
                        </div>

                        <div className="form-group">
                            <label>Upload Images (Optional, max 3)</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*"
                                multiple
                                onChange={e => {
                                    if (e.target.files.length > 3) {
                                        alert('You can only upload up to 3 images');
                                        e.target.value = '';
                                    } else {
                                        setReviewForm({ ...reviewForm, images: e.target.files });
                                    }
                                }}
                            />
                            {editingReview && reviewForm.existingImages && reviewForm.existingImages.length > 0 && (
                                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                    {reviewForm.existingImages.map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${img}`} alt="review" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = reviewForm.existingImages.filter((_, i) => i !== idx);
                                                    setReviewForm({ ...reviewForm, existingImages: updated.length ? updated : '' });
                                                }}
                                                style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 10 }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Submit Review</button>
                        </div>
                    </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {reviews.map(review => (
                        <div key={review._id} style={{ padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {review.user?.name || 'Anonymous User'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 2, color: 'var(--primary)', fontSize: '0.9rem' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <FiStar key={star} fill={star <= review.rating ? 'var(--primary)' : 'none'} />
                                        ))}
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>
                                    <div>{new Date(review.createdAt).toLocaleDateString()}</div>
                                    {user && (user._id === review.user?._id || user.role === 'admin') && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                            {user._id === review.user?._id && (
                                                <button className="btn btn-secondary btn-sm" onClick={() => {
                                                    setReviewForm({ rating: review.rating, comment: review.comment, images: null, existingImages: review.images });
                                                    setEditingReview(review._id);
                                                    setShowReviewForm(true);
                                                }}><FiEdit size={12} /></button>
                                            )}
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReview(review._id)}><FiTrash2 size={12} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: review.images?.length > 0 ? 16 : 0 }}>
                                {review.comment}
                            </p>
                            {review.images && review.images.length > 0 && (
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {review.images.map((img, idx) => (
                                        <a href={img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${img}`} target="_blank" rel="noreferrer" key={idx}>
                                            <img src={img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${img}`} alt="Review attachment" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {reviews.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            No reviews yet. Be the first to review this product!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
