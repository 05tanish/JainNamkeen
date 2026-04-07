export default function About() {
    return (
        <div className="page container animate-fadeIn">
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>🍿</div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: 12 }}>About Sangam Namkeen</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>A legacy of taste, passed down through generations</p>
                </div>

                <div className="card" style={{ marginBottom: 24, padding: 32 }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Our Story</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        Sangam Namkeen Shop started as a small family venture with a passion for creating the finest Indian snacks.
                        Over the years, we have grown to become a trusted name in the world of namkeen and sweets, serving thousands of
                        happy customers with our authentic recipes and uncompromising quality.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 16 }}>
                        Every product at Sangam Namkeen is crafted with love, using the finest ingredients sourced directly from local
                        farms. We believe in preserving the traditional flavors of India while maintaining the highest standards of hygiene and freshness.
                    </p>
                </div>

                <div className="grid grid-3" style={{ marginBottom: 24 }}>
                    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📍</div>
                        <h3>Visit Us</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>Main Market, Jaipur, Rajasthan 302001</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📞</div>
                        <h3>Call Us</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>+91 98765 43210</p>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>✉️</div>
                        <h3>Email</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>info@sangamnamkeen.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
