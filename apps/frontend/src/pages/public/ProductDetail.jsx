import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiStar, FiEdit, FiTrash2, FiCheck, FiMapPin, FiClock, FiAward } from 'react-icons/fi';
import { Skeleton, Tabs, Tab, TabList, TabPanel, Accordion, AccordionItem, AccordionTrigger, AccordionBody } from '@heroui/react';
import API from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import './ProductDetail.css';

// Accordion is imported directly from @heroui/react above

// Memoized Skeleton components
const ProductImageSkeleton = memo(() => (
    <Skeleton height={500} style={{ borderRadius: 'var(--radius)' }} />
));
ProductImageSkeleton.displayName = 'ProductImageSkeleton';

const ProductDetailsSkeleton = memo(() => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Badge Skeleton */}
        <Skeleton height={40} width="30%" style={{ borderRadius: '50px' }} />
        
        {/* Title Skeleton */}
        <Skeleton height={60} width="80%" />
        
        {/* Description Skeleton */}
        <Skeleton height={80} width="100%" />
        
        {/* Price Skeleton */}
        <Skeleton height={50} width="60%" />
    </div>
));
ProductDetailsSkeleton.displayName = 'ProductDetailsSkeleton';

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
    const [selectedVariant, setSelectedVariant] = useState(null);

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

            const defaultVariant = res.data.variants?.find(v => v.isDefault) ?? res.data.variants?.[0] ?? null;
            setSelectedVariant(defaultVariant);

            // Save to recently viewed
            try {
                const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const filtered = stored.filter(item => (item.id || item._id) !== res.data.id);
                filtered.unshift({
                    id: res.data.id,
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
            await addToCart(product.id, selectedVariant?.id ?? null);
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

    // All useMemo hooks must be called unconditionally — before any early returns
    const descriptionTabContent = useMemo(() => (
        <>
            {/* Details Bento Grid */}
            <div className="details-bento">
                {/* Culinary Notes */}
                <div className="culinary-notes-card">
                    <span className="card-label">
                        The Experience
                    </span>
                    <h2 className="card-title">
                        Culinary Notes
                    </h2>
                    <p className="card-description">
                        Experience the authentic taste of Udaipur with every bite. Crafted using traditional methods passed down through generations, this product delivers a perfect balance of flavors and textures that will transport you to the royal kitchens of Rajasthan.
                    </p>
                    <div className="product-specs">
                        <div>
                            <span className="spec-value">Medium</span>
                            <span className="spec-label">Spice Level</span>
                        </div>
                        <div className="spec-divider"></div>
                        <div>
                            <span className="spec-value">Extra-Crisp</span>
                            <span className="spec-label">Texture</span>
                        </div>
                    </div>
                </div>

                {/* Heritage Ingredients */}
                <div className="ingredients-card">
                    <h2 className="ingredients-title">
                        Heritage Ingredients
                    </h2>
                    <ul className="ingredients-list">
                        <li><FiCheck size={20} /> Premium Gram Flour</li>
                        <li><FiCheck size={20} /> Cold-Pressed Oil</li>
                        <li><FiCheck size={20} /> Authentic Spices</li>
                        <li><FiCheck size={20} /> Hand-mined Salt</li>
                    </ul>
                </div>
            </div>

            {/* Heritage Image */}
            <div className="heritage-image-container">
                <img 
                    src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&h=600&fit=crop&q=80" 
                    alt="Heritage" 
                    className="heritage-image"
                />
                <div className="heritage-overlay">
                    <h3 className="heritage-title">
                        Crafted with Heritage.
                    </h3>
                    <p className="heritage-description">
                        Every product is a tribute to the royal kitchens of Udaipur, where flavors were treated as art forms.
                    </p>
                </div>
            </div>
        </>
    ), []);

    const specificationsTabContent = useMemo(() => (
        <div className="product-specs-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
            padding: '40px 0'
        }}>
            <div className="spec-item" style={{
                padding: 24,
                background: 'var(--surface-container)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
            }}>
                <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    marginBottom: 12,
                    color: 'var(--primary)'
                }}>Weight Options</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>250g, 500g, 1kg</p>
            </div>
            <div className="spec-item" style={{
                padding: 24,
                background: 'var(--surface-container)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
            }}>
                <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    marginBottom: 12,
                    color: 'var(--primary)'
                }}>Shelf Life</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>30 days from manufacturing</p>
            </div>
            <div className="spec-item" style={{
                padding: 24,
                background: 'var(--surface-container)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
            }}>
                <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    marginBottom: 12,
                    color: 'var(--primary)'
                }}>Storage</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Store in a cool, dry place</p>
            </div>
            <div className="spec-item" style={{
                padding: 24,
                background: 'var(--surface-container)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
            }}>
                <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    marginBottom: 12,
                    color: 'var(--primary)'
                }}>Origin</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Made in Udaipur, Rajasthan</p>
            </div>
        </div>
    ), []);

    // Memoize reviews tab content
    const reviewsTabContent = useMemo(() => (
        <div>
            <div className="reviews-header">
                <div>
                    <h2 className="reviews-title">
                        Voice of the Pavilion
                    </h2>
                    <p className="reviews-subtitle">
                        Our customers from across the globe share their experiences with the authentic taste of Rajasthan.
                    </p>
                </div>
                {user && !reviews.find(r => (r.user?.id || r.user) === user.id) && (
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

            <div className="reviews-grid">
                {reviews.slice(0, 3).map(review => (
                    <div key={review._id} className="review-card">
                        <div style={{ display: 'flex', gap: 4, color: 'var(--accent)', marginBottom: 16 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <FiStar key={star} fill={star <= review.rating ? 'var(--accent)' : 'none'} />
                            ))}
                        </div>
                        <p className="review-comment">
                            "{review.comment}"
                        </p>
                        <div className="review-author">
                            <div className="author-avatar">
                                {review.user?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <h4 className="author-name">{review.user?.name || 'Anonymous'}</h4>
                                <span className="author-badge">
                                    Verified Buyer
                                </span>
                            </div>
                        </div>
                        {user && (user.id === (review.user?.id || review.user) || user.role === 'ADMIN') && (
                            <div className="review-actions">
                                {user.id === (review.user?.id || review.user) && (
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
    ), [reviews, user, showReviewForm, editingReview, reviewForm, handleReviewSubmit, handleDeleteReview]);

    // Early returns AFTER all hooks
    if (loading) {
        return (
            <div className="page container" style={{ paddingTop: 32 }}>
                <div className="product-hero-grid">
                    <ProductImageSkeleton />
                    <ProductDetailsSkeleton />
                </div>
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
                <div className="product-hero-grid">
                    {/* Image Gallery */}
                    <div>
                        <div className="product-image-main">
                            {mainImage ? (
                                <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }} />
                            ) : (
                                <span style={{ fontSize: '8rem' }}>🍿</span>
                            )}
                        </div>
                        
                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="product-thumbnails">
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
                            <h1 className="product-title">{product.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                            <span className="product-price">₹{selectedVariant?.price ?? product.price}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                                <>
                                    <span className="product-price-original">₹{product.originalPrice}</span>
                                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <p className="product-description">{product.description}</p>
                        )}

                        {/* Weight Selection */}
                        <div>
                            <label style={{ display: 'block', marginBottom: 12, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                Select Weight
                            </label>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {(product.variants && product.variants.length > 0
                                    ? product.variants
                                    : ['250g', '500g', '1kg'].map(w => ({ id: null, weightLabel: w, price: product.price, stock: product.stock }))
                                ).map(v => {
                                    const isSelected = v.id
                                        ? selectedVariant?.id === v.id
                                        : selectedVariant?.weightLabel === v.weightLabel;
                                    const outOfStock = v.stock === 0;
                                    return (
                                        <button
                                            key={v.id ?? v.weightLabel}
                                            onClick={() => !outOfStock && setSelectedVariant(v)}
                                            disabled={outOfStock}
                                            style={{
                                                padding: '12px 24px',
                                                borderRadius: 'var(--radius-lg)',
                                                border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                                                background: isSelected ? 'var(--primary)' : 'transparent',
                                                color: isSelected ? '#fff' : outOfStock ? 'var(--text-muted)' : 'var(--text-primary)',
                                                fontWeight: 700,
                                                cursor: outOfStock ? 'not-allowed' : 'pointer',
                                                opacity: outOfStock ? 0.5 : 1,
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            {v.weightLabel}
                                            {outOfStock && <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 400 }}>Out of Stock</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Add to Cart */}
                        {(selectedVariant ? selectedVariant.stock > 0 : product.stock > 0) && (
                            <div className="product-actions">
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
                        <div className="product-features">
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

            {/* Tabs Section */}
            <section className="container" style={{ paddingBottom: 80 }}>
                <Tabs
                    defaultSelectedKey="description"
                    color="primary"
                    size="lg"
                    style={{ marginBottom: 40 }}
                >
                    <TabList>
                        <Tab key="description">Description</Tab>
                        <Tab key="reviews">Reviews ({stats.totalReviews})</Tab>
                        <Tab key="specifications">Specifications</Tab>
                    </TabList>

                    <TabPanel key="description">
                        {descriptionTabContent}
                    </TabPanel>

                    <TabPanel key="reviews">
                        {reviewsTabContent}
                    </TabPanel>

                    <TabPanel key="specifications">
                        {specificationsTabContent}
                    </TabPanel>
                </Tabs>
            </section>

            {/* FAQ Section */}
            <section className="container" style={{ paddingBottom: 80 }}>
                <h2 style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontSize: '2rem', 
                    marginBottom: 32,
                    textAlign: 'center',
                    color: 'var(--text-primary)'
                }}>
                    Frequently Asked Questions
                </h2>
                
                <Accordion
                    style={{ maxWidth: 800, margin: '0 auto' }}
                >
                    <AccordionItem key="shipping">
                        <AccordionTrigger>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                What are the shipping charges?
                            </h3>
                        </AccordionTrigger>
                        <AccordionBody>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                We offer FREE shipping on orders above ₹500. For orders below ₹500, a flat delivery charge of ₹40 applies.
                            </p>
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem key="freshness">
                        <AccordionTrigger>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                How do you ensure freshness?
                            </h3>
                        </AccordionTrigger>
                        <AccordionBody>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                All our products are made fresh daily using traditional methods. We package them immediately to lock in the freshness and flavor.
                            </p>
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem key="ingredients">
                        <AccordionTrigger>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                Are your products 100% vegetarian?
                            </h3>
                        </AccordionTrigger>
                        <AccordionBody>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                Yes, all our products are 100% vegetarian and made with premium quality ingredients sourced from trusted suppliers.
                            </p>
                        </AccordionBody>
                    </AccordionItem>

                    <AccordionItem key="returns">
                        <AccordionTrigger>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                What is your return policy?
                            </h3>
                        </AccordionTrigger>
                        <AccordionBody>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                We accept returns within 7 days of delivery if the product is damaged or not as described. Please contact our customer support for assistance.
                            </p>
                        </AccordionBody>
                    </AccordionItem>
                </Accordion>
            </section>
        </div>
    );
}
