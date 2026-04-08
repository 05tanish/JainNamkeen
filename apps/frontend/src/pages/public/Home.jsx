import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import API from '../../api/axios';
import './Home.css';

export default function Home() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        API.get('/products?featured=true&limit=3').then(res => setFeaturedProducts(res.data.products));
        API.get('/categories').then(res => setCategories(res.data.slice(0, 3)));
    }, []);

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero" style={{
                background: 'linear-gradient(rgba(44,24,16,0.4), rgba(44,24,16,0.6)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuBbMvGgfBX9vPh8e9ZBNg2EC1QfNpv90yzJezcQgS6bhkoW8Ya7Z6yH2RDP1MHxSVdgkvuT0Jum59HP5_V84SWLqVymS5K4rTy4ZYAkSUh5071lOQB0DDnZ-EeyHQNdTsw0_ZGdQ5r1z6qXMBs2CQ8cnJjaCKFf2Gwq5N74CSTE7es6sFgLSObHTHt1HlHflCBiP3KTCaYuJn9fRkJFlGrnhYKP6wz269_s7INm8adPmaLZSSZuGedQEFNvhQR8erWq0QVlXqFt96s) center/cover',
                backgroundAttachment: 'fixed'
            }}>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-eyebrow">Welcome to Jain</div>
                        <h1>
                            Taste the <span className="tradition">Tradition</span> of Udaipur
                        </h1>
                        <p>
                            Take a culinary stroll through the vibrant streets of Udaipur through generations of flavor. Authentic flavors made with care, bringing the royal kitchens to your doorstep.
                        </p>
                        <div className="hero-actions">
                            <Link to="/products" className="btn btn-primary btn-lg">
                                Explore Collections
                            </Link>
                            <Link to="/about" className="btn btn-secondary btn-lg">
                                Our Story
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Collections */}
            <section className="featured-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Collections</h2>
                        <Link to="/products" className="view-all-link">
                            View All <FiArrowRight />
                        </Link>
                    </div>
                    <div className="collections-grid">
                        {categories.map((cat, idx) => {
                            // Use namkeen/snacks images from Unsplash
                            const imageUrls = [
                                'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop', // Indian snacks
                                'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=400&fit=crop', // Traditional Indian food
                                'https://images.unsplash.com/photo-1596040033229-a0b3b7d1b8b8?w=400&h=400&fit=crop'  // Indian sweets
                            ];
                            return (
                                <Link to={`/products?category=${cat._id}`} key={cat._id} className="collection-card">
                                    <div className="collection-image">
                                        <img 
                                            src={imageUrls[idx] || imageUrls[0]} 
                                            alt={cat.name}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400'; }}
                                        />
                                    </div>
                                    <h3>{cat.name}</h3>
                                    <p>{cat.description || 'Handcrafted with authentic spices and traditional recipes'}</p>
                                    <span className="collection-link">SHOP NOW</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Heritage Story */}
            <section className="heritage-section">
                <div className="container">
                    <div className="heritage-content">
                        <div className="heritage-images">
                            <div className="heritage-image" style={{ transform: 'translateY(32px)' }}>
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNP5QtPWZqGNZDE0CR4yvjrhUlCArz-jJXEj-BNi5GC20-r6Zzx7KS4eMGIXd2IjwNmp1-MFwp7gdZ3qQjE2HHb6_AJd1QhFEafxgOfGLHWtDNPwBW3JZ12Enr8oeabpP-bHCRvL40aONR0HwER02LnF4_00VQ5PZ4WWKx7_JYDBRrcAP8pf3BqFdofEeQbEh36yBSkZVZKgbb9e-zPPSxj_hVtX1Nb9uqq1kOmHldP7J0QqWZes3RpB5eOb2Q-g9VWJuwDsvJpQI" alt="Traditional Udaipur market stall" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }} />
                            </div>
                            <div className="heritage-image">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF__oFAC0_srHFBlgfbDeF_500CV7RQVvX1WMIZWGRkszsFUJdpHanyWaO3740UuEHpF-L1iIh7sWJZmRqCf85Xgol3cBVFUzDuM5HW70q-Qzz9oN0aRChnGL-14_1dRHVp6kcqUg23zS-B_xZlByP7dhWbvzM1XKrYt35iemTqmj1RyHvyiTQcQK9WGAps82GyukNJlzyelOokfWD8lme-4qswC6IDVzkhEKHw6R8kjSeonYwcZ0TMuDezNw5OgDJsFF9GCpRbfg" alt="Rajasthani palace carvings" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }} />
                            </div>
                        </div>
                        <div className="heritage-text">
                            <h3>Our Story</h3>
                            <h2>The Heritage of Udaipur</h2>
                            <p>
                                Founded on the shores of Lake Pichola in 1948, Jain Namkeen is built on a rich legacy of authentic Indian flavors. Every product is a testament to our commitment to quality and tradition.
                            </p>
                            <p>
                                From sourcing the finest ingredients to following time-honored recipes, we ensure that every bite transports you to the royal kitchens of Rajasthan. Our family's secret recipes have been passed down through generations.
                            </p>
                            <p>
                                Today, we're proud to share our heritage with families across India, maintaining the same standards of excellence that our founders established over seven decades ago.
                            </p>
                            <div className="heritage-stats">
                                <div className="stat-item">
                                    <span className="stat-number">70+</span>
                                    <span className="stat-label">Years of Legacy</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">100%</span>
                                    <span className="stat-label">Authentic Recipes</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">50k+</span>
                                    <span className="stat-label">Happy Families</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials-section">
                <div className="container">
                    <h2>Voices of Appreciation</h2>
                    <p className="subtitle">What our customers say about us</p>
                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <p className="testimonial-text">
                                "The flavors are incredibly fresh and authentic. It takes me back to my childhood in Rajasthan. The quality is unmatched and the packaging keeps everything fresh."
                            </p>
                            <div className="testimonial-author">
                                <div className="author-avatar">SM</div>
                                <div className="author-info">
                                    <h4>Sukhit Mishra</h4>
                                    <p>Delhi, India</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <p className="testimonial-text">
                                "I ordered the Mewari Sweets for a special occasion and everyone loved them. The taste is exactly like what you get in Udaipur. Highly recommend!"
                            </p>
                            <div className="testimonial-author">
                                <div className="author-avatar">DM</div>
                                <div className="author-info">
                                    <h4>Divya Mishra</h4>
                                    <p>Mumbai, India</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <p className="testimonial-text">
                                "The Mewari Namkeen and sweets are simply the best. You can taste the quality in every bite. This is now my go-to for all festive occasions."
                            </p>
                            <div className="testimonial-author">
                                <div className="author-avatar">VM</div>
                                <div className="author-info">
                                    <h4>Varun Mehta</h4>
                                    <p>Bangalore, India</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
