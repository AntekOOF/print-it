import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  Smartphone,
  TicketCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LineSkeleton } from '../components/LoadingSkeleton.jsx';
import ServiceChips from '../components/ServiceChips.jsx';
import { createGcashCheckout, getPaymentConfig, getPublicOrder } from '../lib/api.js';
import { formatCurrency, formatDateTime, formatLabel, formatPaymentLabel } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';

function OrderSummaryPage() {
  const { trackingToken } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({
    gcashEnabled: false,
    manualGcashEnabled: false,
    manualGcashNumber: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingCheckout, setIsRefreshingCheckout] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const [orderData, paymentData] = await Promise.all([getPublicOrder(trackingToken), getPaymentConfig()]);

        if (!ignore) {
          setOrder(orderData);
          setPaymentConfig(paymentData);
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

    loadOrder();

    return () => {
      ignore = true;
    };
  }, [trackingToken]);

  const paymentState = searchParams.get('payment');

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(paymentConfig.manualGcashNumber);
      setCopyState('Copied');
      window.setTimeout(() => setCopyState(''), 1800);
    } catch {
      setCopyState('Copy failed');
      window.setTimeout(() => setCopyState(''), 1800);
    }
  };

  const handleRefreshCheckout = async () => {
    try {
      setIsRefreshingCheckout(true);
      setError('');
      const refreshedOrder = await createGcashCheckout(trackingToken);
      setOrder(refreshedOrder);

      if (refreshedOrder.paymentUrl) {
        window.location.assign(refreshedOrder.paymentUrl);
      }
    } catch (checkoutError) {
      setError(checkoutError.message);
    } finally {
      setIsRefreshingCheckout(false);
    }
  };

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      {isLoading ? (
        <div className="panel">
          <LineSkeleton count={6} />
        </div>
      ) : null}

      {!isLoading && error ? <div className="panel error-panel">{error}</div> : null}

      {!isLoading && order ? (
        <>
          <section className="success-banner">
            <div>
              <span className="eyebrow">Order submitted</span>
              <h1>{order.orderNumber}</h1>
              <p>
                Track fulfillment here. This page is public for the order holder and shows payment, status, and item
                details.
              </p>
            </div>

            <div className="success-banner__status">
              <CheckCircle2 size={18} />
              <span>{formatLabel(order.status)}</span>
            </div>
          </section>

          {paymentState ? (
            <div className={`panel payment-state payment-state--${paymentState}`}>
              <strong>
                {paymentState === 'success' ? 'GCash checkout returned successfully.' : 'GCash checkout was cancelled.'}
              </strong>
              <p>
                Current payment status: <strong>{formatLabel(order.paymentStatus)}</strong>
              </p>
            </div>
          ) : null}

          <section className="section section--split">
            <div className="panel">
              <div className="panel__row">
                <span>Customer</span>
                <strong>{order.customerName}</strong>
              </div>
              <div className="panel__row">
                <span>Contact</span>
                <strong>{order.contactNumber}</strong>
              </div>
              <div className="panel__row">
                <span>Email</span>
                <strong>{order.email || 'Not provided'}</strong>
              </div>
              <div className="panel__row">
                <span>Fulfillment</span>
                <strong>{formatLabel(order.fulfillmentMethod)}</strong>
              </div>
              <div className="panel__row">
                <span>Payment</span>
                <strong>
                  {formatPaymentLabel(order.paymentMethod)} | {formatLabel(order.paymentStatus)}
                </strong>
              </div>
              {order.paymentReference ? (
                <div className="panel__row">
                  <span>Reference</span>
                  <strong>{order.paymentReference}</strong>
                </div>
              ) : null}
              <div className="panel__row">
                <span>Created</span>
                <strong>{formatDateTime(order.createdAt)}</strong>
              </div>
              {order.paidAt ? (
                <div className="panel__row">
                  <span>Paid at</span>
                  <strong>{formatDateTime(order.paidAt)}</strong>
                </div>
              ) : null}
              {order.notes ? (
                <div className="panel__note">
                  <Clock3 size={16} />
                  <p>{order.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="panel">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">Items</span>
                  <h2>Summary</h2>
                </div>
              </div>

              <div className="summary-list">
                {order.items.map((item) => (
                  <article className="summary-item" key={item.id}>
                    <img alt={item.productName} src={resolveMediaUrl(item.productImage)} />

                    <div className="summary-item__content">
                      <div className="summary-item__top">
                        <div>
                          <h3>{item.productName}</h3>
                          <p>{item.category}</p>
                        </div>
                        <strong>{formatCurrency(item.lineTotal)}</strong>
                      </div>

                      <ServiceChips details={item.serviceDetails} showFileLink />

                      {item.serviceDetails?.specialInstructions ? (
                        <p className="summary-item__note">{item.serviceDetails.specialInstructions}</p>
                      ) : null}

                      <div className="summary-item__bottom">
                        <span>{item.quantity} units</span>
                        <strong>{formatCurrency(item.unitPrice)} each</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="order-total">
                <span>Total</span>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
            </div>
          </section>

          {order.paymentMethod === 'manual_gcash' && paymentConfig.manualGcashEnabled ? (
            <section className="panel">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">Manual GCash payment</span>
                  <h2>Send the transfer to this number</h2>
                </div>
              </div>

              <div className="payment-manual">
                <div className="payment-manual__number">
                  <Smartphone size={18} />
                  <strong>{paymentConfig.manualGcashNumber}</strong>
                </div>

                <div className="inline-actions">
                  <button className="button button--ghost button--compact" type="button" onClick={handleCopyNumber}>
                    <Copy size={16} />
                    {copyState || 'Copy number'}
                  </button>
                </div>
              </div>

              <p className="summary-item__note">
                Send the payment manually, then wait for the admin to verify and mark the order as paid. Use your
                order number as the transfer note when possible.
              </p>
              {order.paymentReference ? (
                <p className="summary-item__note">
                  Submitted reference: <strong>{order.paymentReference}</strong>
                </p>
              ) : null}
            </section>
          ) : null}

          {order.paymentMethod === 'gcash' && order.paymentStatus !== 'paid' ? (
            <section className="panel">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">GCash payment</span>
                  <h2>Continue or retry checkout</h2>
                </div>
              </div>

              <div className="inline-actions">
                {order.paymentUrl ? (
                  <a className="button button--primary" href={order.paymentUrl} rel="noreferrer" target="_blank">
                    <ExternalLink size={16} />
                    Open current checkout
                  </a>
                ) : null}
                <button
                  className="button button--ghost"
                  disabled={isRefreshingCheckout}
                  type="button"
                  onClick={handleRefreshCheckout}
                >
                  {isRefreshingCheckout ? <LoaderCircle className="spin" size={16} /> : <CreditCard size={16} />}
                  {isRefreshingCheckout ? 'Generating...' : 'Generate new GCash link'}
                </button>
              </div>
            </section>
          ) : null}

          <div className="section__header">
            <Link className="button button--primary" to="/">
              Place another order
            </Link>
            <Link className="button button--ghost" to="/track-order">
              <TicketCheck size={16} />
              Track another order
            </Link>
          </div>
        </>
      ) : null}
    </motion.main>
  );
}

export default OrderSummaryPage;
