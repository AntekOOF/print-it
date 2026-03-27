import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldEllipsis,
  ShoppingBag,
  Sparkles,
  TicketCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useSiteSettings } from '../hooks/useSiteSettings.js';

const CATALOG_LINKS = [
  { label: 'Products', to: '/products' },
  { label: 'Services', to: '/services' },
  { label: 'Menu', to: '/menu' },
  { label: 'Gallery', to: '/gallery' },
];

const PRIMARY_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Track Order', to: '/track-order', icon: TicketCheck },
];

function Navbar({ cartCount, onCartOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const { settings } = useSiteSettings();
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navbarRef = useRef(null);

  const isCatalogActive = CATALOG_LINKS.some((item) => location.pathname.startsWith(item.to));
  const accountLabel = isAuthenticated
    ? isAdmin
      ? 'Admin'
      : user?.fullName?.split(' ')[0] || 'Account'
    : 'Account';
  const accountHref = isAdmin ? '/admin' : '/account';

  const handleLogout = () => {
    setIsAccountOpen(false);
    setIsMobileOpen(false);
    logout();

    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/login', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  const handleNavigationSelect = () => {
    setIsCatalogOpen(false);
    setIsAccountOpen(false);
    setIsMobileOpen(false);
  };

  const handleCatalogToggle = () => {
    setIsCatalogOpen((currentState) => !currentState);
    setIsAccountOpen(false);
  };

  const handleAccountToggle = () => {
    setIsAccountOpen((currentState) => !currentState);
    setIsCatalogOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!navbarRef.current?.contains(event.target)) {
        setIsCatalogOpen(false);
        setIsAccountOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCatalogOpen(false);
        setIsAccountOpen(false);
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header ref={navbarRef} className="navbar">
      <Link className="brand" to="/">
        <span className="brand__badge">
          <Sparkles size={16} />
        </span>
        <span className="brand__copy">
          <strong>{settings.businessName}</strong>
          <small>Snacks, prints, and order tracking</small>
        </span>
      </Link>

      <div className="navbar__desktop">
        <nav className="navbar__links" aria-label="Main navigation">
          {PRIMARY_LINKS.slice(0, 1).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
                to={item.to}
                onClick={handleNavigationSelect}
              >
                {Icon ? <Icon size={16} /> : null}
                {item.label}
              </NavLink>
            );
          })}

          <div className="navbar__dropdown">
            <button
              aria-expanded={isCatalogOpen}
              className={`navbar__link navbar__dropdown-toggle${isCatalogActive ? ' navbar__link--active' : ''}`}
              type="button"
              onClick={handleCatalogToggle}
            >
              Browse
              <ChevronDown size={16} />
            </button>

            {isCatalogOpen ? (
              <div className="navbar__dropdown-menu">
                {CATALOG_LINKS.map((item) => (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      `navbar__dropdown-link${isActive ? ' navbar__dropdown-link--active' : ''}`
                    }
                    to={item.to}
                    onClick={handleNavigationSelect}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>

          {PRIMARY_LINKS.slice(1).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
                to={item.to}
                onClick={handleNavigationSelect}
              >
                {Icon ? <Icon size={16} /> : null}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="navbar__actions">
          <Link className="button button--primary button--compact" to="/products" onClick={handleNavigationSelect}>
            Order now
          </Link>

          <button
            className="cart-button cart-button--compact"
            type="button"
            onClick={() => {
              setIsMobileOpen(false);
              onCartOpen();
            }}
          >
            <ShoppingBag size={18} />
            <span>Cart</span>
            <span className="cart-button__count">{cartCount}</span>
          </button>

          <div className="navbar__dropdown navbar__dropdown--account">
            <button
              aria-expanded={isAccountOpen}
              className="button button--ghost button--compact navbar__account-trigger"
              type="button"
              onClick={handleAccountToggle}
            >
              {isAuthenticated ? isAdmin ? <ShieldEllipsis size={16} /> : <UserRound size={16} /> : <UserRound size={16} />}
              {accountLabel}
              <ChevronDown size={16} />
            </button>

            {isAccountOpen ? (
              <div className="navbar__dropdown-menu navbar__dropdown-menu--right">
                {isAuthenticated ? (
                  <>
                    <Link className="navbar__dropdown-link" to={accountHref} onClick={handleNavigationSelect}>
                      {isAdmin ? 'Open dashboard' : 'View account'}
                    </Link>
                    <button className="navbar__dropdown-action" type="button" onClick={handleLogout}>
                      <LogOut size={16} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="navbar__dropdown-link" to="/login" onClick={handleNavigationSelect}>
                      Login
                    </Link>
                    <Link
                      className="navbar__dropdown-link navbar__dropdown-link--active"
                      to="/signup"
                      onClick={handleNavigationSelect}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <button
        aria-expanded={isMobileOpen}
        aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className="navbar__toggle"
        type="button"
        onClick={() => {
          setIsMobileOpen((currentState) => !currentState);
          setIsCatalogOpen(false);
          setIsAccountOpen(false);
        }}
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isMobileOpen ? (
        <div className="navbar__mobile-panel">
          <nav className="navbar__mobile-links" aria-label="Mobile navigation">
            {PRIMARY_LINKS.slice(0, 1).map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) => `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`}
                to={item.to}
                onClick={handleNavigationSelect}
              >
                {item.label}
              </NavLink>
            ))}

            <button
              aria-expanded={isCatalogOpen}
              className={`navbar__mobile-link${isCatalogActive ? ' navbar__mobile-link--active' : ''}`}
              type="button"
              onClick={handleCatalogToggle}
            >
              <span>Browse catalog</span>
              <ChevronDown size={16} />
            </button>

            {isCatalogOpen ? (
              <div className="navbar__mobile-submenu">
                {CATALOG_LINKS.map((item) => (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      `navbar__mobile-sublink${isActive ? ' navbar__mobile-sublink--active' : ''}`
                    }
                    to={item.to}
                    onClick={handleNavigationSelect}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}

            {PRIMARY_LINKS.slice(1).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  className={({ isActive }) => `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`}
                  to={item.to}
                  onClick={handleNavigationSelect}
                >
                  {Icon ? <Icon size={16} /> : null}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="navbar__mobile-actions">
            <Link className="button button--primary" to="/products" onClick={handleNavigationSelect}>
              Order now
            </Link>

            <button
              className="cart-button"
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                onCartOpen();
              }}
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              <span className="cart-button__count">{cartCount}</span>
            </button>

            {isAuthenticated ? (
              <>
                <Link className="button button--ghost" to={accountHref} onClick={handleNavigationSelect}>
                  {isAdmin ? <ShieldEllipsis size={16} /> : <UserRound size={16} />}
                  {isAdmin ? 'Dashboard' : 'Account'}
                </Link>
                <button className="button button--ghost" type="button" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="button button--ghost" to="/login" onClick={handleNavigationSelect}>
                  Login
                </Link>
                <Link className="button button--primary" to="/signup" onClick={handleNavigationSelect}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
