import { motion } from 'framer-motion';
import { BarChart3, Eye, Package, ReceiptText, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminProductForm from '../components/AdminProductForm.jsx';
import { LineSkeleton, ProductGridSkeleton } from '../components/LoadingSkeleton.jsx';
import ServiceChips from '../components/ServiceChips.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getOrderSummary,
  getOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateProduct,
  updateProductActive,
} from '../lib/api.js';
import { formatCurrency, formatDateTime, formatLabel, formatPaymentLabel, formatProductAvailability } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  paymentStatus: '',
  dateFrom: '',
  dateTo: '',
};

const ORDER_STATUSES = ['pending', 'processing', 'ready', 'completed'];
const PAYMENT_STATUSES = ['', 'pending', 'awaiting_payment', 'paid', 'failed', 'expired', 'refunded'];

function AdminPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterDraft, setFilterDraft] = useState(DEFAULT_FILTERS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingProductId, setTogglingProductId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [productsData, ordersData, summaryData] = await Promise.all([
          getAdminProducts(token),
          getOrders(token, filters),
          getOrderSummary(token),
        ]);

        if (!ignore) {
          setProducts(productsData);
          setOrders(ordersData);
          setSummary(summaryData);
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

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [filters, refreshIndex, token]);

  const triggerRefresh = () => {
    setRefreshIndex((currentValue) => currentValue + 1);
  };

  const handleSaveProduct = async (values) => {
    try {
      setIsSaving(true);
      setError('');

      if (editingProduct) {
        await updateProduct(token, editingProduct.id, values);
      } else {
        await createProduct(token, values);
      }

      setEditingProduct(null);
      triggerRefresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product? Existing order history will remain.')) {
      return;
    }

    try {
      setDeletingId(productId);
      setError('');
      await deleteProduct(token, productId);

      if (editingProduct?.id === productId) {
        setEditingProduct(null);
      }

      triggerRefresh();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleProduct = async (product) => {
    try {
      setTogglingProductId(product.id);
      setError('');
      await updateProductActive(token, product.id, !product.isActive);
      triggerRefresh();
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      setError('');
      await updateOrderStatus(token, orderId, status);
      triggerRefresh();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId, paymentStatus) => {
    try {
      setUpdatingPaymentId(orderId);
      setError('');
      await updatePaymentStatus(token, orderId, paymentStatus);
      triggerRefresh();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const updateFilterDraft = (field) => (event) =>
    setFilterDraft((currentFilters) => ({
      ...currentFilters,
      [field]: event.target.value,
    }));

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setFilters(filterDraft);
  };

  const handleResetFilters = () => {
    setFilterDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  const dashboardCards = summary
    ? [
        { icon: Package, label: 'Products', value: products.length },
        { icon: ReceiptText, label: 'Total orders', value: summary.totalOrders },
        { icon: ReceiptText, label: 'Pending orders', value: summary.pendingOrders },
        { icon: BarChart3, label: 'Booked today', value: formatCurrency(summary.bookedToday) },
        { icon: BarChart3, label: 'Booked this week', value: formatCurrency(summary.bookedThisWeek) },
        { icon: ShieldCheck, label: 'Paid total', value: formatCurrency(summary.totalPaid) },
      ]
    : [];

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="section__header">
        <div>
          <span className="eyebrow">Admin dashboard</span>
          <h1>Protected catalog and order operations</h1>
          <p className="section-copy">Signed in as {user?.fullName || user?.email}. Manage inventory, filters, and order states here.</p>
        </div>

        <button className="button button--ghost" type="button" onClick={triggerRefresh}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      </section>

      {summary ? (
        <div className="stats-grid stats-grid--wide">
          {dashboardCards.map((card) => (
            <div className="stat-card" key={card.label}>
              <card.icon size={18} />
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <div className="panel error-panel">{error}</div> : null}

      <section className="admin-layout">
        <AdminProductForm
          key={editingProduct?.id || 'new'}
          isSaving={isSaving}
          product={editingProduct}
          token={token}
          onCancel={() => setEditingProduct(null)}
          onSubmit={handleSaveProduct}
        />

        <div className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Catalog</span>
              <h2>Existing products</h2>
            </div>
          </div>

          {isLoading ? <ProductGridSkeleton count={3} /> : null}

          {!isLoading ? (
            <div className="admin-product-list">
              {products.map((product) => (
                <article className="admin-product-card" key={product.id}>
                  <img alt={product.name} src={resolveMediaUrl(product.image)} />
                  <div className="admin-product-card__body">
                    <div>
                      <div className="card-tag-row">
                        <span className="pill">{product.category}</span>
                        <span className={`availability-pill${product.isActive ? '' : ' availability-pill--danger'}`}>
                          {product.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="card-tag-row">
                        {formatProductAvailability(product) ? <span className="availability-pill">{formatProductAvailability(product)}</span> : null}
                        {product.category === 'Services' ? (
                          <span className="availability-pill">
                            {product.serviceConfig?.printTypes?.length || 0} print types
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <strong>{formatCurrency(product.price)}</strong>
                  </div>
                  <div className="admin-product-card__actions">
                    <button className="button button--ghost" type="button" onClick={() => setEditingProduct(product)}>
                      Edit
                    </button>
                    <button
                      className="button button--ghost"
                      disabled={togglingProductId === product.id}
                      type="button"
                      onClick={() => handleToggleProduct(product)}
                    >
                      {togglingProductId === product.id ? 'Updating...' : product.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      className="button button--danger"
                      disabled={deletingId === product.id}
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 size={16} />
                      {deletingId === product.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Orders</span>
            <h2>Filtered submissions</h2>
          </div>
        </div>

        <form className="admin-filters" onSubmit={handleFilterSubmit}>
          <div className="field">
            <label htmlFor="orderSearch">Search</label>
            <input
              id="orderSearch"
              placeholder="Order number, customer, or contact"
              value={filterDraft.search}
              onChange={updateFilterDraft('search')}
            />
          </div>

          <div className="field">
            <label htmlFor="orderStatusFilter">Order status</label>
            <select id="orderStatusFilter" value={filterDraft.status} onChange={updateFilterDraft('status')}>
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="paymentStatusFilter">Payment status</label>
            <select id="paymentStatusFilter" value={filterDraft.paymentStatus} onChange={updateFilterDraft('paymentStatus')}>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status || 'all'} value={status}>
                  {status ? formatLabel(status) : 'All payment states'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="dateFrom">Date from</label>
            <input id="dateFrom" type="date" value={filterDraft.dateFrom} onChange={updateFilterDraft('dateFrom')} />
          </div>

          <div className="field">
            <label htmlFor="dateTo">Date to</label>
            <input id="dateTo" type="date" value={filterDraft.dateTo} onChange={updateFilterDraft('dateTo')} />
          </div>

          <div className="admin-filter-actions">
            <button className="button button--primary" type="submit">
              Apply filters
            </button>
            <button className="button button--ghost" type="button" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </form>

        {isLoading ? <LineSkeleton count={8} /> : null}

        {!isLoading && !orders.length ? (
          <div className="empty-panel empty-panel--compact">
            <ReceiptText size={24} />
            <h3>No orders matched the current filters</h3>
            <p>Try clearing the search or date range to load more results.</p>
          </div>
        ) : null}

        {!isLoading && orders.length ? (
          <div className="order-feed">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__head">
                  <div>
                    <div className="card-tag-row">
                      <span className="pill">{formatLabel(order.status)}</span>
                      <span className={`availability-pill${order.paymentStatus === 'paid' ? '' : ' availability-pill--warning'}`}>
                        {formatLabel(order.paymentStatus)}
                      </span>
                    </div>
                    <h3>{order.orderNumber}</h3>
                    <p>
                      {order.customerName} | {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>

                <div className="order-card__meta">
                  <span>{order.contactNumber}</span>
                  <span>{formatLabel(order.fulfillmentMethod)}</span>
                  <span>{formatPaymentLabel(order.paymentMethod)}</span>
                  <span>{order.email || 'No email'}</span>
                </div>

                <div className="order-card__controls">
                  <div className="field field--compact">
                    <label htmlFor={`order-status-${order.id}`}>Update status</label>
                    <select
                      id={`order-status-${order.id}`}
                      disabled={updatingOrderId === order.id}
                      value={order.status}
                      onChange={(event) => handleOrderStatusChange(order.id, event.target.value)}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field field--compact">
                    <label htmlFor={`payment-status-${order.id}`}>Update payment</label>
                    <select
                      id={`payment-status-${order.id}`}
                      disabled={updatingPaymentId === order.id}
                      value={order.paymentStatus}
                      onChange={(event) => handlePaymentStatusChange(order.id, event.target.value)}
                    >
                      {PAYMENT_STATUSES.filter(Boolean).map((status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inline-actions">
                    <Link className="button button--ghost button--compact" to={`/orders/${order.trackingToken}`}>
                      <Eye size={16} />
                      Public view
                    </Link>
                    {order.paymentMethod === 'gcash' && order.paymentUrl && order.paymentStatus !== 'paid' ? (
                      <a className="button button--ghost button--compact" href={order.paymentUrl} rel="noreferrer" target="_blank">
                        Open payment
                      </a>
                    ) : null}
                  </div>
                </div>

                {order.paymentReference ? (
                  <p className="summary-item__note">
                    Payment reference: <strong>{order.paymentReference}</strong>
                  </p>
                ) : null}

                <div className="order-card__items order-card__items--stacked">
                  {order.items.map((item) => (
                    <div className="order-card__item-row" key={item.id}>
                      <div className="order-card__item">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                      </div>
                      <ServiceChips details={item.serviceDetails} showFileLink />
                    </div>
                  ))}
                </div>

                {order.notes ? <p className="summary-item__note">{order.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </motion.main>
  );
}

export default AdminPage;
