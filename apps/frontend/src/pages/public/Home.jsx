import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiTrendingUp, FiArrowRight, FiStar, FiAward, FiHeart, FiTruck } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import './Home.css';

export default function Home() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const { user } = useAuth();
    const { addToCart } = useCart();

    useEffect(() => {
        API.get('/products?featured=true&limit=8').then(res => setFeaturedProducts(res.data.products));
        API.get('/products/trending').then(res => setTrendingProducts(res.data));
        API.get('/categories').then(res => setCategories(res.data));
    }, []);

    const handleAddToCart = async (productId, e) => {
        e.preventDefault();
        if (!user) return window.location.assign('/login');
        await addToCart(productId);
    };

    const ProductCard = ({ product }) => (
        <div className="product-card animate-fadeIn">
            <Link to={`/product/${product._id}`} style={{ display: 'block' }}>
                <div className="product-image">
                    {(product.images && product.images.length > 0) || product.image ? (
                        <img src={product.images && product.images.length > 0 ? product.images[0].url : (product.image?.startsWith('http') ? product.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${product.image}`)} alt={product.name} />
                    ) : (
                        <span style={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))' }}>🍿</span>
                    )}
                    {product.isFeatured && (
                        <span style={{
                            position: 'absolute', top: 12, left: 12, padding: '4px 12px',
                            background: 'var(--primary)',
                            borderRadius: 30, fontSize: '0.7rem', fontWeight: 800, color: '#FFF',
                            textTransform: 'uppercase', letterSpacing: 1, boxShadow: '0 2px 10px rgba(255,122,0,0.4)'
                        }}><FiStar style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Featured</span>
                    )}
                </div>
                <div className="product-info">
                    <div className="product-category">{product.category?.name || 'Snacks'}</div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">₹{product.price}<span className="product-weight">{product.weight}</span></div>
                </div>
            </Link>
            <div className="product-actions">
                <button className="btn btn-primary" style={{ flex: 1, padding: '10px 0' }} onClick={(e) => handleAddToCart(product._id, e)}>Add to Cart</button>
            </div>
        </div>
    );

    return (
        <div className="home">
            {/* Hero */}
            <section className="hero">
                <div className="hero-bg"></div>
                <div className="container" style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                    <div className="hero-content">
                        <div className="hero-badge">🏆 Trusted Heritage of Taste</div>
                        <h1>Premium Indian <br /><span className="hero-highlight">Namkeen & Sweets</span></h1>
                        <p>Handcrafted with love, seasoned with tradition. Experience the authentic flavors of India delivered fresh to your doorstep.</p>
                        <div className="hero-actions">
                            <Link to="/products" className="btn btn-primary">Shop Collection <FiArrowRight /></Link>
                            <Link to="/about" className="btn btn-secondary">Discover Our Story</Link>
                        </div>
                        <div className="hero-stats">
                            <div className="hero-stat"><strong>50+</strong><span>Exquisite Products</span></div>
                            <div className="hero-stat"><strong>10K+</strong><span>Happy Connoisseurs</span></div>
                            <div className="hero-stat"><strong>100%</strong><span>Authentic & Pure</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="section container">
                <div className="section-header">
                    <div>
                        <h2>Curated Collections</h2>
                        <p>Explore our wide range of traditional and contemporary snacks</p>
                    </div>
                </div>
                <div className="categories-grid">
                    {categories.map(cat => (
                        <Link to={`/products?category=${cat._id}`} key={cat._id} className="category-card">
                            <div className="category-emoji">
                                {cat.name.includes('Namkeen') ? '🥜' : cat.name.includes('Bhujia') ? '🌶️' : cat.name.includes('Chips') ? '🍟' : cat.name.includes('Sweet') ? '🍬' : '🎁'}
                            </div>
                            <h3>{cat.name}</h3>
                            <p>{cat.description || 'Explore our authentic selection'}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Trending Products */}
            {trendingProducts.length > 0 && (
                <section className="section container">
                    <div className="section-header">
                        <div>
                            <h2><FiTrendingUp style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: 12 }} />Trending Now</h2>
                            <p>Discover what our community is loving right now</p>
                        </div>
                        <Link to="/products?sort=popular" className="view-all">View All Collection <FiArrowRight /></Link>
                    </div>
                    <div className="grid grid-4">
                        {trendingProducts.slice(0, 4).map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Featured / Bestsellers */}
            <section className="section container">
                <div className="section-header">
                    <div>
                        <h2>Signature Bestsellers</h2>
                        <p>The timeless classics that defined our heritage</p>
                    </div>
                    <Link to="/products?featured=true" className="view-all">View All Collection <FiArrowRight /></Link>
                </div>
                <div className="grid grid-4">
                    {featuredProducts.map(product => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="section container" style={{ marginBottom: 40 }}>
                <div className="section-header" style={{ textAlign: 'center', justifyContent: 'center', marginBottom: 60 }}>
                    <div>
                        <h2>The Sangam Promise</h2>
                        <p>What makes our namkeen the favorite across India</p>
                    </div>
                </div>
                <div className="grid grid-3">
                    <div className="feature-card">
                        <div className="feature-icon"><FiAward /></div>
                        <h3>100% Natural</h3>
                        <p>Made with pure ingredients, authentic spices, and zero artificial flavors. Only the best for our patrons.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><FiHeart /></div>
                        <h3>Crafted Daily</h3>
                        <p>Our artisans prepare products fresh every day with love, care, and generations of expertise.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><FiTruck /></div>
                        <h3>Express Delivery</h3>
                        <p>Quick, safe, and pristine delivery right to your doorstep, ensuring maximum freshness across India.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
