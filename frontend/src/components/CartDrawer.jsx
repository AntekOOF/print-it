import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { formatCurrency } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';
import QuantitySelector from './QuantitySelector.jsx';
import ServiceChips from './ServiceChips.jsx';

function CartDrawer({ isOpen, onClose }) {
  const { cartItems, itemCount, removeItem, subtotal, updateQuantity } = useCart();

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="drawer-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            animate={{ x: 0 }}
            className="drawer"
            exit={{ x: '105%' }}
            initial={{ x: '105%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          >
            <div className="drawer__header">
              <div>
                <span className="eyebrow">Current cart</span>
                <h2>{itemCount} items queued</h2>
              </div>

              <button aria-label="Close cart" className="icon-button" type="button" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {cartItems.length ? (
              <>
                <div className="drawer__items">
                  {cartItems.map((item) => (
                    <article className="drawer-item" key={item.cartItemId}>
                      <img alt={item.name} src={resolveMediaUrl(item.image)} />

                      <div className="drawer-item__content">
                        <div className="drawer-item__head">
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.category}</p>
                          </div>

                          <button
                            aria-label={`Remove ${item.name}`}
                            className="icon-button icon-button--danger"
                            type="button"
                            onClick={() => removeItem(item.cartItemId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <ServiceChips details={item.serviceDetails} />

                        <div className="drawer-item__footer">
                          <QuantitySelector
                            value={item.quantity}
                            onChange={(quantity) => updateQuantity(item.cartItemId, quantity)}
                          />
                          <strong>{formatCurrency(item.price * item.quantity)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="drawer__summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <p>Checkout supports cash on pickup or GCash when the payment provider is configured.</p>
                </div>

                <Link className="button button--primary button--block" to="/checkout" onClick={onClose}>
                  Proceed to checkout
                </Link>
              </>
            ) : (
              <div className="empty-panel empty-panel--compact">
                <ShoppingBag size={26} />
                <h3>Your cart is empty</h3>
                <p>Add snacks or a print job from the menu to start an order.</p>
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default CartDrawer;
