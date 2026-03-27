import { motion } from 'framer-motion';
import { Clock3, ExternalLink, ReceiptText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineSkeleton } from '../components/LoadingSkeleton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getMyOrders } from '../lib/api.js';
import { formatCurrency, formatDateTime, formatLabel, formatPaymentLabel } from '../lib/formatters.js';

function AccountPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const data = await getMyOrders(token);

        if (!ignore) {
          setOrders(data);
          setError('');
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="page-hero">
        <span className="eyebrow">My Account</span>
        <h1>{user?.fullName}</h1>
        <p>{user?.email}</p>
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow">Order history</span>
            <h2>Your confirmations and active orders</h2>
          </div>

          <Link className="button button--primary" to="/products">
            Start a new order
          </Link>
        </div>

        {isLoading ? <LineSkeleton count={5} /> : null}
        {!isLoading && error ? <div className="panel error-panel">{error}</div> : null}

        {!isLoading && !error && !orders.length ? (
          <div className="empty-panel empty-panel--compact">
            <ReceiptText size={28} />
            <h3>No orders yet</h3>
            <p>Your future orders and confirmations will appear here after checkout.</p>
          </div>
        ) : null}

        {!isLoading && !error && orders.length ? (
          <div className="account-order-list">
            {orders.map((order) => (
              <article className="panel account-order-card" key={order.id}>
                <div className="account-order-card__head">
                  <div>
                    <div className="card-tag-row">
                      <span className="pill">{formatLabel(order.status)}</span>
                      <span className="availability-pill">{formatLabel(order.paymentStatus)}</span>
                    </div>
                    <h3>{order.orderNumber}</h3>
                  </div>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>

                <div className="order-card__meta">
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span>{formatPaymentLabel(order.paymentMethod)}</span>
                  <span>{order.contactNumber}</span>
                </div>

                <div className="inline-actions">
                  <Link className="button button--ghost button--compact" to={`/orders/${order.trackingToken}`}>
                    <ExternalLink size={16} />
                    Open confirmation
                  </Link>
                </div>

                {order.notes ? (
                  <div className="panel__note">
                    <Clock3 size={16} />
                    <p>{order.notes}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </motion.main>
  );
}

export default AccountPage;
