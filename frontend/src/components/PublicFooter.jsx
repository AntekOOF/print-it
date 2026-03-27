import { Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSiteSettings.js';

function PublicFooter() {
  const { settings } = useSiteSettings();

  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <span className="eyebrow">{settings.businessName}</span>
          <h3>Snacks, prints, and order confirmation in one campus-friendly storefront.</h3>
          <div className="site-footer__contact">
            <span>
              <Phone size={14} />
              {settings.contactPhone}
            </span>
            <span>
              <Mail size={14} />
              {settings.contactEmail}
            </span>
            <span>
              <MapPin size={14} />
              {settings.contactLocation}
            </span>
          </div>
        </div>

        <div className="site-footer__links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/services">Services</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/track-order">Track Order</Link>
          <a href={settings.contactFacebook} rel="noreferrer" target="_blank">
            <Facebook size={14} />
            Facebook
          </a>
        </div>
      </div>

      <div className="site-footer__meta">
        <span>{settings.businessName}</span>
        <span>Quality Prints for a Cause</span>
      </div>
    </footer>
  );
}

export default PublicFooter;
