import { Link } from 'react-router-dom';
import { site } from '../data/site.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col footer-about">
          <h3 className="footer-logo">{site.name}</h3>
          <p>
            Everyday and festive clothing for men, women and kids at honest retail prices with direct delivery across India.
          </p>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/men">Men</Link></li>
            <li><Link to="/women">Women</Link></li>
            <li><Link to="/kids">Kids</Link></li>
            <li><Link to="/products">All Products</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul className="footer-contact">
            <li>{site.address}</li>
            <li>{site.phone}</li>
            <li>{site.email}</li>
            <li>{site.hours}</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© 2026 {site.name} {site.tagline}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
