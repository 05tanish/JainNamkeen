export default function About() {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section style={{
                padding: '100px 0 80px',
                background: 'linear-gradient(rgba(44,24,16,0.7), rgba(44,24,16,0.7)), url(https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600) center/cover',
                color: '#fff',
                textAlign: 'center'
            }}>
                <div className="container">
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: '20px' }}>
                        Our Heritage
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', lineHeight: 1.2, marginBottom: '24px', maxWidth: '800px', margin: '0 auto 24px' }}>
                        A Legacy of Flavor Since 1948
                    </h1>
                    <p style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', opacity: 0.9, lineHeight: 1.7 }}>
                        Founded in Udaipur, a city steeped in the glory of Mewar's royal legacy, Jain Namkeen has been crafting authentic flavors for over seven decades. Our journey began with a simple mission: to bring the taste of royal kitchens to every home.
                    </p>
                </div>
            </section>

            {/* Roots Section */}
            <section style={{ padding: '100px 0', background: 'var(--surface)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '80px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <img 
                                src="https://images.unsplash.com/photo-1596040033229-a0b3b7d1b8b8?w=400&h=500&fit=crop" 
                                alt="Traditional Indian Sweets and Namkeen" 
                                style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--primary)',
                                color: '#fff',
                                padding: '12px 32px',
                                borderRadius: '50px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap',
                                boxShadow: 'var(--shadow)'
                            }}>
                                "The secret is in the spices"
                            </div>
                        </div>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '24px', color: 'var(--text-primary)' }}>
                                Roots in the City of Lakes
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px', fontSize: '1.05rem' }}>
                                In 1948, our founder started a small shop near the banks of Lake Pichola in Udaipur. With a passion for authentic flavors and a commitment to quality, he began creating namkeen using recipes passed down through generations of royal cooks.
                            </p>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px', fontSize: '1.05rem' }}>
                                From sourcing the purest spices from local markets to hand-pressing each batch with care, the founding principles remain unchanged. The secret lies not just in the ingredients, but in the love and dedication poured into every product.
                            </p>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                                Today, we continue this legacy, bringing the authentic taste of Udaipur to families across India. Every bite is a journey back to the royal kitchens of Rajasthan.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pillars Section */}
            <section style={{ padding: '100px 0', background: 'var(--surface-container)' }}>
                <div className="container">
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', textAlign: 'center', marginBottom: '60px', color: 'var(--text-primary)' }}>
                        The Pillars of Jain Namkeen
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                        <div style={{ background: '#fff', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🌾</div>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
                                Uncompromised Purity
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                We source only the finest ingredients from trusted suppliers. Every grain, every spice is carefully selected to ensure the highest quality and authentic taste.
                            </p>
                        </div>
                        <div style={{ background: 'var(--primary)', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', color: '#fff' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>👨‍🍳</div>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '16px' }}>
                                Time-Honored Recipes
                            </h3>
                            <p style={{ opacity: 0.9, lineHeight: 1.7 }}>
                                Our recipes have been perfected over generations, preserving the authentic flavors of Rajasthan. Each product is made following traditional methods passed down through our family.
                            </p>
                        </div>
                        <div style={{ background: 'var(--accent)', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', color: '#fff' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🤝</div>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '16px' }}>
                                Customer Devotion
                            </h3>
                            <p style={{ opacity: 0.9, lineHeight: 1.7 }}>
                                Our customers are family. We treat every order with care and dedication, ensuring that the flavors of Udaipur reach your home with the same freshness and quality.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Born in Udaipur Section */}
            <section style={{
                padding: '120px 0',
                background: 'linear-gradient(rgba(44,24,16,0.6), rgba(44,24,16,0.6)), url(https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600) center/cover',
                color: '#fff',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: '20px' }}>
                        Born in the heart of Udaipur
                    </h2>
                    <p style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', opacity: 0.9 }}>
                        Where tradition meets taste, and every flavor tells a story
                    </p>
                </div>
            </section>

            {/* Hand-Pressed Tradition */}
            <section style={{ padding: '100px 0', background: 'var(--surface)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '80px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '24px', color: 'var(--text-primary)' }}>
                                The Hand-Pressed Tradition
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px', fontSize: '1.05rem' }}>
                                At Jain Namkeen, we believe that the best flavors come from traditional methods. Our artisans hand-press each batch using techniques that have been refined over decades, ensuring consistent quality and authentic taste.
                            </p>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '32px', fontSize: '1.05rem' }}>
                                This labor of love results in products that are not just snacks, but a celebration of Rajasthani heritage. Every piece is crafted with care, maintaining the texture and flavor that our customers have loved for generations.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>✓</div>
                                    <span style={{ color: 'var(--text-secondary)' }}>Hand-selected ingredients</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>✓</div>
                                    <span style={{ color: 'var(--text-secondary)' }}>Crafted in small batches</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>✓</div>
                                    <span style={{ color: 'var(--text-secondary)' }}>Authentic royal recipes</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <img 
                                src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=600&fit=crop" 
                                alt="Traditional namkeen preparation" 
                                style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '80px 0',
                background: 'var(--primary)',
                color: '#fff',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '16px' }}>
                        Experience the Taste of Udaipur
                    </h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '32px', opacity: 0.9 }}>
                        Explore our family's renowned recipes bringing the authentic flavors of Rajasthan to your doorstep
                    </p>
                    <a href="/products" className="btn btn-lg" style={{
                        background: '#fff',
                        color: 'var(--primary)',
                        padding: '16px 48px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: '50px',
                        display: 'inline-block',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        Shop Our Collections
                    </a>
                </div>
            </section>
        </div>
    );
}
