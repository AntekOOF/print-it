import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import CartDrawer from './components/CartDrawer.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useCart } from './hooks/useCart.js';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import OrderSummaryPage from './pages/OrderSummaryPage.jsx';
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

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--top" />
      <div className="app-shell__glow app-shell__glow--bottom" />

      <Navbar cartCount={itemCount} onCartOpen={handleCartOpen} />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage onCartOpen={handleCartOpen} />} />
          <Route path="/checkout" element={<CheckoutPage />} />
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

      <CartDrawer isOpen={isCartOpen} onClose={handleCartClose} />
    </div>
  );
}

export default App;
