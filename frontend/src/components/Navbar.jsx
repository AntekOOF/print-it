import { LogOut, ShieldEllipsis, ShoppingBag, Sparkles, TicketCheck, UserRound } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useSiteSettings } from '../hooks/useSiteSettings.js';

function Navbar({ cartCount, onCartOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const { settings } = useSiteSettings();

  const handleLogout = () => {
    logout();

    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/login', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <span className="brand__badge">
          <Sparkles size={16} />
        </span>
        <span>
          <strong>{settings.businessName}</strong>
          <small>Snacks, prints, and order tracking</small>
        </span>
      </Link>

      <nav className="navbar__links" aria-label="Main navigation">
        <NavLink className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} to="/">
          Home
        </NavLink>
        <NavLink className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} to="/products">
          Products
        </NavLink>
        <NavLink className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} to="/services">
          Services
        </NavLink>
        <NavLink className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} to="/about">
          About
        </NavLink>
        <NavLink className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} to="/contact">
          Contact
        </NavLink>
        <NavLink className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} to="/track-order">
          <TicketCheck size={16} />
          Track Order
        </NavLink>
      </nav>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <Link className="button button--ghost button--compact" to={isAdmin ? '/admin' : '/account'}>
            {isAdmin ? <ShieldEllipsis size={16} /> : <UserRound size={16} />}
            {isAdmin ? 'Dashboard' : user?.fullName?.split(' ')[0] || 'Account'}
          </Link>
        ) : (
          <div className="inline-actions">
            <Link className="button button--ghost button--compact" to="/login">
              Login
            </Link>
            <Link className="button button--primary button--compact" to="/signup">
              Sign up
            </Link>
          </div>
        )}

        {isAuthenticated ? (
          <button className="button button--ghost button--compact" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        ) : null}

        <div className="inline-actions">
          <Link className="button button--primary button--compact" to="/products">
            Order now
          </Link>

          <button className="cart-button" type="button" onClick={onCartOpen}>
            <ShoppingBag size={18} />
            <span>Cart</span>
            <span className="cart-button__count">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
