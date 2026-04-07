import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-about">
                        <h3><span className="brand-icon">🍿</span> Sangam Namkeen</h3>
                        <p>Bringing you the finest traditional Indian namkeen & sweets since generations. Taste the authentic flavors of India.</p>
                    </div>

                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/products">Products</Link>
                        <Link to="/pages/about-us">About Us</Link>
                    </div>

                    <div className="footer-links">
                        <h4>Legal</h4>
                        <Link to="/pages/terms-and-conditions">Terms & Conditions</Link>
                        <Link to="/pages/privacy-policy">Privacy Policy</Link>
                        <Link to="/pages/refund-policy">Refund Policy</Link>
                    </div>

                    <div className="footer-links">
                        <h4>Contact</h4>
                        <p>📍 Main Market, Jaipur</p>
                        <p>📞 +91 98765 43210</p>
                        <p>✉️ info@sangamnamkeen.com</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Sangam Namkeen Shop. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
