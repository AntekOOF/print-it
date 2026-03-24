import { CreditCard, LogOut, ShieldEllipsis, ShoppingBag, Sparkles, TicketCheck } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function Navbar({ cartCount, onCartOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();

    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <span className="brand__badge">
          <Sparkles size={16} />
        </span>
        <span>
          <strong>Print-IT</strong>
          <small>Snacks, prints, and order tracking</small>
        </span>
      </Link>

      <nav className="navbar__links" aria-label="Main navigation">
        <NavLink className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} to="/">
          Menu
        </NavLink>
        <NavLink
          className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
          to="/checkout"
        >
          <CreditCard size={16} />
          Checkout
        </NavLink>
        <NavLink
          className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
          to="/track-order"
        >
          <TicketCheck size={16} />
          Track
        </NavLink>
        <NavLink
          className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
          to={isAuthenticated ? '/admin' : '/admin/login'}
        >
          <ShieldEllipsis size={16} />
          {isAuthenticated ? 'Dashboard' : 'Admin'}
        </NavLink>
      </nav>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <button className="button button--ghost button--compact" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            {user?.fullName?.split(' ')[0] || 'Logout'}
          </button>
        ) : null}

        <button className="cart-button" type="button" onClick={onCartOpen}>
          <ShoppingBag size={18} />
          <span>Cart</span>
          <span className="cart-button__count">{cartCount}</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
