import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content navbar-width-limiter">
        <div className="footer-row-grid">
          
          {/* Logo & Description */}
          <div className="footer-col brand-info">
            <span className="footer-logo">Sanjay<span className="logo-accent">Sales</span></span>
            <span className="logo-subtext">Commercial B2B Partner</span>
            <p className="brand-description">
              Sanjay Sales is India's leading digital B2B wholesale platform. We supply kirana stores, department stores, caterers, offices, and small businesses with premium FMCG, daily essentials, and sweets at direct distributor prices.
            </p>
            <div className="gst-trust-badge">
              <span className="badge-check">✓</span>
              <span>100% Tax Compliant GST Invoices</span>
            </div>
          </div>

          {/* Catalog Categories */}
          <div className="footer-col">
            <h4>Commercial Catalog</h4>
            <ul className="footer-links">
              <li><a href="#chocolates" onClick={(e) => e.preventDefault()}>Chocolates & Candies</a></li>
              <li><a href="#groceries" onClick={(e) => e.preventDefault()}>Daily Use Toiletries</a></li>
              <li><a href="#home" onClick={(e) => e.preventDefault()}>Home Cleaning Essentials</a></li>
              <li><a href="#sweets" onClick={(e) => e.preventDefault()}>Sweets & Namkeen</a></li>
              <li><a href="#beverages" onClick={(e) => e.preventDefault()}>Beverages & Soda Cans</a></li>
              <li><a href="#grains" onClick={(e) => e.preventDefault()}>Bulk Grains & Oils</a></li>
            </ul>
          </div>

          {/* Business Support */}
          <div className="footer-col">
            <h4>B2B Cooperation</h4>
            <ul className="footer-links">
              <li><a href="#about" onClick={(e) => e.preventDefault()}>About Sanjay Sales</a></li>
              <li><a href="#bulk" onClick={(e) => e.preventDefault()}>Bulk Order Agreements</a></li>
              <li><a href="#gst" onClick={(e) => e.preventDefault()}>How to claim GST Input Tax</a></li>
              <li><a href="#partner" onClick={(e) => e.preventDefault()}>Become a Supply Partner</a></li>
              <li><a href="#credit" onClick={(e) => e.preventDefault()}>Commercial Line of Credit</a></li>
              <li><a href="#hubs" onClick={(e) => e.preventDefault()}>Our Distribution Hubs</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col contact-info">
            <h4>Corporate Desk</h4>
            <p className="contact-item">
              <strong>Address:</strong> Sanjay Sales, Sabzi mandi, Jhajjar, Haryana Pincode: 124103
            </p>
            <p className="contact-item">
              <strong>Email:</strong> wholesale@sanjaysales.com
            </p>
            <p className="contact-item">
              <strong>Phone:</strong> +917496865205
            </p>
            <p className="contact-item">
              <strong>Hours:</strong> Mon - Sat: 9:00 AM - 5:00 PM (Kirana supply hours)
            </p>
            <p className="contact-item" style={{ marginTop: '16px' }}>
              <Link to="/admin" style={{ color: 'var(--color-accent)', fontWeight: 'bold', textDecoration: 'underline' }}>
                🔒 Admin Control Desk
              </Link>
            </p>
          </div>

        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom-flex">
          <div className="copyright-text">
            © 2026 Sanjay Sales Private Limited. All business names, logos and trademarks are properties of their respective owners.
          </div>
          <div className="payment-options">
            <span className="payment-label">Accepted Wholesale Payments:</span>
            <span className="payment-pill">NEFT / RTGS</span>
            <span className="payment-pill">UPI</span>
            <span className="payment-pill">Commercial Credit</span>
            <span className="payment-pill">GST Invoice Pay</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
