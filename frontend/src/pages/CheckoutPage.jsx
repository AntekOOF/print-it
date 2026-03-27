import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, ReceiptText, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuantitySelector from '../components/QuantitySelector.jsx';
import ServiceChips from '../components/ServiceChips.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { createOrder, getPaymentConfig } from '../lib/api.js';
import { formatCurrency } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CheckoutPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { cartItems, clearCart, removeItem, subtotal, updateQuantity } = useCart();
  const [form, setForm] = useState({
    contactNumber: '',
    fulfillmentMethod: 'pickup',
    paymentMethod: 'cash_on_pickup',
    paymentReference: '',
    notes: '',
  });
  const [paymentConfig, setPaymentConfig] = useState({
    gcashEnabled: false,
    manualGcashEnabled: false,
    manualGcashNumber: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadPaymentConfig = async () => {
      try {
        const data = await getPaymentConfig();

        if (!ignore) {
          setPaymentConfig(data);
        }
      } catch {
        if (!ignore) {
          setPaymentConfig({
            gcashEnabled: false,
            manualGcashEnabled: false,
            manualGcashNumber: '',
          });
        }
      }
    };

    loadPaymentConfig();

    return () => {
      ignore = true;
    };
  }, []);

  const updateField = (field) => (event) =>
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.contactNumber.trim()) {
      setError('Contact number is required.');
      return;
    }

    if (user?.email && !EMAIL_PATTERN.test(user.email)) {
      setError('Your account email is invalid. Please sign in again.');
      return;
    }

    if (!cartItems.length) {
      setError('Add items to the cart before submitting the order.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const order = await createOrder(token, {
        customerName: user?.fullName || '',
        ...form,
        email: user?.email || '',
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          serviceDetails: item.serviceDetails,
        })),
      });

      clearCart();
      navigate(`/orders/${order.trackingToken}`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cartItems.length) {
    return (
      <motion.main
        animate={{ opacity: 1, y: 0 }}
        className="page"
        exit={{ opacity: 0, y: 16 }}
        initial={{ opacity: 0, y: 16 }}
      >
        <div className="empty-panel">
          <ReceiptText size={30} />
          <h1>No items ready for checkout</h1>
          <p>Build the order from the menu first, then return here to submit it.</p>
          <Link className="button button--primary" to="/products">
            <ArrowLeft size={16} />
            Back to products
          </Link>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page page--checkout"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="section__header">
        <div>
          <span className="eyebrow">Checkout</span>
          <h1>Submit order details</h1>
        </div>

        <Link className="button button--ghost" to="/products">
          <ArrowLeft size={16} />
          Continue shopping
        </Link>
      </section>

      <div className="checkout-layout">
        <form className="panel" onSubmit={handleSubmit}>
          <div className="panel__header">
            <div>
              <span className="eyebrow">Account checkout</span>
              <h2>Order information</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="accountName">Customer name</label>
              <input id="accountName" readOnly value={user?.fullName || ''} />
            </div>

            <div className="field">
              <label htmlFor="accountEmail">Account email</label>
              <input id="accountEmail" readOnly type="email" value={user?.email || ''} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="contactNumber">Contact number for this order</label>
            <input
              id="contactNumber"
              placeholder="0917..."
              value={form.contactNumber}
              onChange={updateField('contactNumber')}
            />
          </div>

          <div className="panel panel--soft">
            <p className="summary-item__note">
              Checkout is tied to your signed-in account so your order confirmation also appears in your account page.
            </p>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="fulfillmentMethod">Fulfillment method</label>
              <select id="fulfillmentMethod" value={form.fulfillmentMethod} onChange={updateField('fulfillmentMethod')}>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="paymentMethod">Payment method</label>
              <select id="paymentMethod" value={form.paymentMethod} onChange={updateField('paymentMethod')}>
                <option value="cash_on_pickup">Cash on pickup</option>
                <option disabled={!paymentConfig.gcashEnabled} value="gcash">
                  GCash via PayMongo {paymentConfig.gcashEnabled ? '' : '(Unavailable)'}
                </option>
                <option disabled={!paymentConfig.manualGcashEnabled} value="manual_gcash">
                  Manual GCash transfer {paymentConfig.manualGcashEnabled ? '' : '(Unavailable)'}
                </option>
              </select>
            </div>
          </div>

          <div className="payment-panel">
            <div className="payment-panel__item">
              <CreditCard size={16} />
              <div>
                <strong>Cash on pickup</strong>
                <p>Order is submitted immediately and payment happens during pickup or fulfillment.</p>
              </div>
            </div>
            <div className="payment-panel__item">
              <Smartphone size={16} />
              <div>
                <strong>GCash via PayMongo</strong>
                <p>
                  {paymentConfig.gcashEnabled
                    ? 'A secure checkout link is generated after order submission.'
                    : 'Add PayMongo keys to the backend environment to enable GCash checkout.'}
                </p>
              </div>
            </div>
            <div className="payment-panel__item">
              <Smartphone size={16} />
              <div>
                <strong>Manual GCash transfer</strong>
                <p>
                  {paymentConfig.manualGcashEnabled
                    ? `Send payment to ${paymentConfig.manualGcashNumber} after placing the order, then wait for admin verification.`
                    : 'Add a manual GCash number on the backend to enable direct transfer instructions.'}
                </p>
              </div>
            </div>
          </div>

          {form.paymentMethod === 'manual_gcash' && paymentConfig.manualGcashEnabled ? (
            <div className="panel panel--soft">
              <div className="panel__row">
                <span>Send payment to</span>
                <strong className="payment-number">{paymentConfig.manualGcashNumber}</strong>
              </div>
              <p className="summary-item__note">
                Place the order first, then send the payment to this number. Use your name or order number as the
                transfer note so the admin can verify it faster.
              </p>
              <div className="field">
                <label htmlFor="paymentReference">Sender name or transfer reference</label>
                <input
                  id="paymentReference"
                  placeholder="Optional: your name or GCash reference code"
                  value={form.paymentReference}
                  onChange={updateField('paymentReference')}
                />
              </div>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="notes">Order notes</label>
            <textarea
              id="notes"
              placeholder="Pickup time, landmark, or general notes"
              rows="5"
              value={form.notes}
              onChange={updateField('notes')}
            />
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button--primary button--block" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Submitting order...' : 'Submit order'}
          </button>
        </form>

        <aside className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Order summary</span>
              <h2>Review the cart</h2>
            </div>
          </div>

          <div className="summary-list">
            {cartItems.map((item) => (
              <article className="summary-item" key={item.cartItemId}>
                <img alt={item.name} src={resolveMediaUrl(item.image)} />

                <div className="summary-item__content">
                  <div className="summary-item__top">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.category}</p>
                    </div>
                    <button className="summary-item__remove" type="button" onClick={() => removeItem(item.cartItemId)}>
                      Remove
                    </button>
                  </div>

                  <ServiceChips details={item.serviceDetails} />

                  {item.serviceDetails?.specialInstructions ? (
                    <p className="summary-item__note">{item.serviceDetails.specialInstructions}</p>
                  ) : null}

                  <div className="summary-item__bottom">
                    <QuantitySelector value={item.quantity} onChange={(value) => updateQuantity(item.cartItemId, value)} />
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="order-total">
            <span>Total</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
        </aside>
      </div>
    </motion.main>
  );
}

export default CheckoutPage;
