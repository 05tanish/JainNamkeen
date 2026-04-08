import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiArrowLeft, FiStar, FiEdit, FiTrash2, FiCheck, FiMapPin, FiClock, FiAward } from 'react-icons/fi';
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
    const [selectedWeight, setSelectedWeight] = useState('250g');

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

            if (reviewForm.images) {
                Array.from(reviewForm.images).forEach(file => {
                    formData.append('images', file);
                });
            }

            if (editingReview) {
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

    const weightOptions = ['250g', '500g', '1kg'];

    return (
        <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
            {/* Breadcrumbs */}
            <div className="container" style={{ paddingTop: 32 }}>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
                    <span>›</span>
                    <Link to="/products" style={{ color: 'var(--text-secondary)' }}>Products</Link>
                    <span>›</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{product.name}</span>
                </nav>
            </div>

            {/* Product Hero Section */}
            <section className="container" style={{ paddingBottom: 80 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
                    {/* Image Gallery */}
                    <div>
                        <div style={{
                            aspectRatio: '1/1',
                            background: 'var(--surface-container-low)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 48,
                            marginBottom: 24
                        }}>
                            {mainImage ? (
                                <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }} />
                            ) : (
                                <span style={{ fontSize: '8rem' }}>🍿</span>
                            )}
                        </div>
                        
                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                {product.images.map((img, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setMainImage(img.url)}
                                        style={{
                                            aspectRatio: '1/1',
                                            borderRadius: 'var(--radius-sm)',
                                            overflow: 'hidden',
                                            border: mainImage === img.url ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            cursor: 'pointer',
                                            opacity: mainImage === img.url ? 1 : 0.6,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <img src={img.url} alt={`${product.name} ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Badge */}
                        {product.category?.name && (
                            <span style={{
                                display: 'inline-block',
                                background: 'var(--accent)',
                                color: '#fff',
                                padding: '6px 16px',
                                borderRadius: '50px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                width: 'fit-content'
                            }}>
                                {product.category.name}
                            </span>
                        )}

                        {/* Title & Rating */}
                        <div>
                            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', marginBottom: 16, lineHeight: 1.1, color: 'var(--text-primary)', fontWeight: 900 }}>
                                {product.name}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ display: 'flex', gap: 4, color: 'var(--accent)' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <FiStar key={star} fill={star <= stats.averageRating ? 'var(--accent)' : 'none'} size={20} />
                                    ))}
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    ({stats.totalReviews} Reviews)
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                            <span style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>
                                ₹{product.price}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                                <>
                                    <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                        ₹{product.originalPrice}
                                    </span>
                                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8, maxWidth: '600px' }}>
                                {product.description}
                            </p>
                        )}

                        {/* Weight Selection */}
                        <div>
                            <label style={{ display: 'block', marginBottom: 12, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                Select Weight
                            </label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {weightOptions.map(weight => (
                                    <button
                                        key={weight}
                                        onClick={() => setSelectedWeight(weight)}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: 'var(--radius-lg)',
                                            border: selectedWeight === weight ? '2px solid var(--primary)' : '2px solid var(--border)',
                                            background: selectedWeight === weight ? 'var(--primary)' : 'transparent',
                                            color: selectedWeight === weight ? '#fff' : 'var(--text-primary)',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {weight}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Add to Cart */}
                        {product.stock > 0 && (
                            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAddToCart}
                                    style={{
                                        flex: 1,
                                        height: 56,
                                        fontSize: '1.1rem',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                        boxShadow: '0 8px 24px rgba(156,68,0,0.3)'
                                    }}
                                >
                                    <FiShoppingCart /> {added ? '✓ Added to Cart!' : 'Add to Cart'}
                                </button>
                                <button
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        height: 56,
                                        fontSize: '1.1rem',
                                        background: 'var(--primary-container)',
                                        color: 'var(--text-primary)',
                                        border: '2px solid var(--primary)'
                                    }}
                                >
                                    Buy Now
                                </button>
                            </div>
                        )}

                        {/* Features */}
                        <div style={{
                            marginTop: 32,
                            paddingTop: 32,
                            borderTop: '1px solid var(--border)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiCheck style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
                                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>100% Vegetarian</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiAward style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
                                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>No Preservatives</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiClock style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
                                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Fresh Daily</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiMapPin style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
                                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Made in Udaipur</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Details Bento Grid */}
            <section className="container" style={{ paddingBottom: 80 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, marginBottom: 32 }}>
                    {/* Culinary Notes */}
                    <div style={{
                        background: 'var(--surface-container-low)',
                        padding: 48,
                        borderRadius: 'var(--radius-xl)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <span style={{
                            color: 'var(--primary)',
                            fontWeight: 700,
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            marginBottom: 16
                        }}>
                            The Experience
                        </span>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: 24, fontWeight: 700 }}>
                            Culinary Notes
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: 32 }}>
                            Experience the authentic taste of Udaipur with every bite. Crafted using traditional methods passed down through generations, this product delivers a perfect balance of flavors and textures that will transport you to the royal kitchens of Rajasthan.
                        </p>
                        <div style={{ display: 'flex', gap: 32 }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>Medium</span>
                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', opacity: 0.6 }}>Spice Level</span>
                            </div>
                            <div style={{ width: 1, background: 'var(--border)' }}></div>
                            <div>
                                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>Extra-Crisp</span>
                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', opacity: 0.6 }}>Texture</span>
                            </div>
                        </div>
                    </div>

                    {/* Heritage Ingredients */}
                    <div style={{
                        background: 'var(--primary)',
                        padding: 48,
                        borderRadius: 'var(--radius-xl)',
                        color: '#fff'
                    }}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 24, fontWeight: 700 }}>
                            Heritage Ingredients
                        </h2>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, fontWeight: 500 }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiCheck size={20} /> Premium Gram Flour
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiCheck size={20} /> Cold-Pressed Oil
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiCheck size={20} /> Authentic Spices
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FiCheck size={20} /> Hand-mined Salt
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Heritage Image */}
                <div style={{
                    height: 400,
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWp7hMcsN2rZFeI8uERn3fgW5OHrH7Ta-aOPt0m8qDaeD0z6K9582VH6JHdBFtkTa4BuZQqMHFspqsFprvfR1H9aDP8p1YuJ66-QTP06-kTv0o04_1bugeR53gPYIwjOJFm_t4_WTNRyaNcri_If3wjTau2A7YfgFChTo95MUdEfGDqRjytUTIUHKgsLUpwymT-Rol73TjwJcmA1-cdW9clKcMj0kEOiTO0p7PZySLAPX3s5xyBGOxNt1WazuNIfkmRh5UbkDVsek" 
                        alt="Heritage" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: 48
                    }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: '#fff', fontWeight: 700, marginBottom: 8, fontStyle: 'italic' }}>
                            Crafted with Heritage.
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 600 }}>
                            Every product is a tribute to the royal kitchens of Udaipur, where flavors were treated as art forms.
                        </p>
                    </div>
                </div>
            </section>

            {/* Customer Reviews */}
            <section style={{ background: 'var(--surface-container-lowest)', padding: '80px 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64 }}>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, marginBottom: 16 }}>
                                Voice of the Pavilion
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: 500 }}>
                                Our customers from across the globe share their experiences with the authentic taste of Rajasthan.
                            </p>
                        </div>
                        {user && !reviews.find(r => r.user?._id === user._id) && (
                            <button 
                                className="btn btn-primary" 
                                onClick={() => { setShowReviewForm(!showReviewForm); setEditingReview(null); setReviewForm({ rating: 5, comment: '', images: [] }); }}
                            >
                                {showReviewForm ? 'Cancel' : 'Write a Review'}
                            </button>
                        )}
                    </div>

                    {showReviewForm && (
                        <form onSubmit={handleReviewSubmit} className="card animate-fadeIn" style={{ marginBottom: 48, background: 'var(--surface-container)' }}>
                            <h3 style={{ marginBottom: 24 }}>{editingReview ? 'Edit Your Review' : 'Write a Review'}</h3>

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
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Review</button>
                            </div>
                        </form>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                        {reviews.slice(0, 3).map(review => (
                            <div key={review._id} style={{
                                padding: 32,
                                background: 'var(--surface-container-low)',
                                borderRadius: 'var(--radius-xl)',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', gap: 4, color: 'var(--accent)', marginBottom: 16 }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <FiStar key={star} fill={star <= review.rating ? 'var(--accent)' : 'none'} />
                                    ))}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontStyle: 'italic', lineHeight: 1.7 }}>
                                    "{review.comment}"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700
                                    }}>
                                        {review.user?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{review.user?.name || 'Anonymous'}</h4>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                                            Verified Buyer
                                        </span>
                                    </div>
                                </div>
                                {user && (user._id === review.user?._id || user.role === 'admin') && (
                                    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
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
                        ))}
                    </div>

                    {reviews.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                            No reviews yet. Be the first to review this product!
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
