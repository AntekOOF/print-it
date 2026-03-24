import { Link } from 'react-router-dom';

function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <span className="eyebrow">Print-IT</span>
          <h3>Snacks, prints, and order confirmation in one campus-friendly storefront.</h3>
        </div>

        <div className="site-footer__links">
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/about">About Us</Link>
          <Link to="/track-order">Track Order</Link>
        </div>
      </div>

      <div className="site-footer__meta">
        <span>Print-IT</span>
        <span>Quality Prints for a Cause</span>
      </div>
    </footer>
  );
}

export default PublicFooter;
