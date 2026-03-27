import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthenticatedRoute from './components/AuthenticatedRoute.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicFooter from './components/PublicFooter.jsx';
import ScrollToTopButton from './components/ScrollToTopButton.jsx';
import { useCart } from './hooks/useCart.js';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import OrderSummaryPage from './pages/OrderSummaryPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import TrackOrderPage from './pages/TrackOrderPage.jsx';

function App() {
  const location = useLocation();
  const { itemCount } = useCart();
  const [cartState, setCartState] = useState({
    isOpen: false,
    pathname: location.pathname,
  });

  const handleCartOpen = () => {
    setCartState({
      isOpen: true,
      pathname: location.pathname,
    });
  };

  const handleCartClose = () => {
    setCartState((currentState) => ({
      ...currentState,
      isOpen: false,
    }));
  };

  const isCartOpen = cartState.isOpen && cartState.pathname === location.pathname;
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--top" />
      <div className="app-shell__glow app-shell__glow--bottom" />

      {!isAdminRoute ? <Navbar cartCount={itemCount} onCartOpen={handleCartOpen} /> : null}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage onCartOpen={handleCartOpen} />} />
          <Route path="/products" element={<ProductsPage onCartOpen={handleCartOpen} />} />
          <Route path="/services" element={<ServicesPage onCartOpen={handleCartOpen} />} />
          <Route path="/menu" element={<MenuPage onCartOpen={handleCartOpen} />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/account"
            element={
              <AuthenticatedRoute>
                <AccountPage />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <AuthenticatedRoute>
                <CheckoutPage />
              </AuthenticatedRoute>
            }
          />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/orders/:trackingToken" element={<OrderSummaryPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>

      {!isAdminRoute ? <PublicFooter /> : null}
      {!isAdminRoute ? <ScrollToTopButton /> : null}
      <CartDrawer isOpen={isCartOpen} onClose={handleCartClose} />
    </div>
  );
}

export default App;
