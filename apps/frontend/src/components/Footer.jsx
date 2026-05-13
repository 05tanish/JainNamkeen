import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-top">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <span>🍿</span>
                            <span>Sangam <strong>Namkeen</strong></span>
                        </div>
                        <p>Handcrafted with love, seasoned with tradition. Authentic Indian namkeen & sweets delivered fresh to your doorstep.</p>
                        <div className="footer-socials">
                            <a href="#" aria-label="Instagram"><FiInstagram /></a>
                            <a href="#" aria-label="Facebook"><FiFacebook /></a>
                            <a href="#" aria-label="Twitter"><FiTwitter /></a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/products">All Products</Link>
                        <Link to="/offers">Offers & Coupons</Link>
                        <Link to="/pages/about-us">About Us</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Legal</h4>
                        <Link to="/pages/terms-and-conditions">Terms & Conditions</Link>
                        <Link to="/pages/privacy-policy">Privacy Policy</Link>
                        <Link to="/pages/refund-policy">Refund Policy</Link>
                        <Link to="/pages/shipping-policy">Shipping Policy</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Contact</h4>
                        <a href="#" className="footer-contact-item">
                            <FiMapPin size={14} /> Main Market, Jaipur, Rajasthan
                        </a>
                        <a href="tel:+919876543210" className="footer-contact-item">
                            <FiPhone size={14} /> +91 98765 43210
                        </a>
                        <a href="mailto:info@sangamnamkeen.com" className="footer-contact-item">
                            <FiMail size={14} /> info@sangamnamkeen.com
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-inner">
                    <p>© {new Date().getFullYear()} Jain Namkeen. All rights reserved.</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Made with ❤️ in India</p>
                </div>
            </div>
        </footer>
    );
}
