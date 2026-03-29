import { motion } from 'framer-motion';
import { BarChart3, BellDot, Boxes, Download, Eye, LayoutDashboard, LogOut, Package, Printer, ReceiptText, RefreshCcw, Settings2, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminProductForm from '../components/AdminProductForm.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { LineSkeleton, ProductGridSkeleton } from '../components/LoadingSkeleton.jsx';
import OrderTimeline from '../components/OrderTimeline.jsx';
import ServiceChips from '../components/ServiceChips.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { createProduct, deleteProduct, getAdminProducts, getOrderSummary, getOrders, getSiteSettings, updateOrderStatus, updatePaymentStatus, updateProduct, updateProductActive, updateSiteSettings } from '../lib/api.js';
import { formatCurrency, formatDateTime, formatLabel, formatPaymentLabel, formatProductAvailability } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';

const DEFAULT_FILTERS = { search: '', status: '', paymentStatus: '', dateFrom: '', dateTo: '' };
const DEFAULT_SETTINGS = { aboutSummary: '', businessName: 'Print-IT', contactEmail: '', contactFacebook: '', contactLocation: '', contactPhone: '', heroHeadline: 'Affordable Printing & Student Products', heroSubtext: 'From snacks to prints, we got you covered!' };
const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'awaiting_payment', 'paid', 'failed', 'expired', 'refunded'];
const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const shortDate = (value) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(value));
const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const htmlEscape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildSeries = (orders) => {
  const today = new Date();
  const points = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return { booked: 0, key: date.toISOString().slice(0, 10), label: shortDate(date), orders: 0 };
  });
  const map = Object.fromEntries(points.map((item) => [item.key, item]));
  orders.forEach((order) => {
    const point = map[String(order.createdAt).slice(0, 10)];
    if (!point) return;
    point.orders += 1;
    point.booked += Number(order.total || 0);
  });
  return points;
};

const buildTopProducts = (orders) => {
  const totals = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      totals[item.productName] ??= { name: item.productName, quantity: 0, revenue: 0 };
      totals[item.productName].quantity += item.quantity;
      totals[item.productName].revenue += Number(item.lineTotal || 0);
    });
  });
  return Object.values(totals).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 5);
};

function AdminPage() {
  const navigate = useNavigate();
  const { logout, token, user } = useAuth();
  const [section, setSection] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterDraft, setFilterDraft] = useState(DEFAULT_FILTERS);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [toasts, setToasts] = useState([]);
  const newestOrderRef = useRef(null);

  const pushToast = (message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const [productsData, filteredOrders, allOrdersData, summaryData, settingsData] = await Promise.all([
          getAdminProducts(token),
          getOrders(token, filters),
          getOrders(token, {}),
          getOrderSummary(token),
          getSiteSettings(),
        ]);
        if (ignore) return;
        setProducts(productsData);
        setOrders(filteredOrders);
        setAllOrders(allOrdersData);
        setSummary(summaryData);
        setSiteSettings(settingsData);
        if (!settingsDirty) setSettingsForm(settingsData);
        setError('');
      } catch (loadError) {
        if (!ignore) setError(loadError.message);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [filters, refreshIndex, settingsDirty, token]);

  useEffect(() => {
    const id = window.setInterval(() => setRefreshIndex((value) => value + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!allOrders.length) return;
    if (newestOrderRef.current && newestOrderRef.current !== allOrders[0].id) {
      pushToast(`New order received: ${allOrders[0].orderNumber}`, 'success');
    }
    newestOrderRef.current = allOrders[0].id;
  }, [allOrders]);

  const stats = summary
    ? [
        { icon: Boxes, label: 'Products', value: products.length },
        { icon: ShoppingCart, label: 'Orders', value: summary.totalOrders || 0 },
        { icon: TriangleAlert, label: 'Pending', value: summary.pendingOrders || 0 },
        { icon: BarChart3, label: 'Daily sales', value: formatCurrency(summary.paidToday || 0) },
        { icon: BarChart3, label: 'Weekly sales', value: formatCurrency(summary.paidThisWeek || 0) },
        { icon: ReceiptText, label: 'Revenue', value: formatCurrency(summary.totalPaid || 0) },
      ]
    : [];
  const series = useMemo(() => buildSeries(allOrders), [allOrders]);
  const topProducts = useMemo(() => buildTopProducts(allOrders), [allOrders]);
  const lowStock = useMemo(() => products.filter((product) => product.category === 'Food' && product.stockQuantity !== null && product.stockQuantity <= 5), [products]);
  const printOrders = useMemo(() => allOrders.filter((order) => order.items.some((item) => item.category === 'Services')), [allOrders]);
  const alerts = useMemo(() => allOrders.filter((order) => order.status === 'pending' || order.paymentStatus === 'awaiting_payment'), [allOrders]);
  const maxBooked = Math.max(...series.map((item) => item.booked), 1);
  const maxOrders = Math.max(...series.map((item) => item.orders), 1);

  const refresh = () => setRefreshIndex((value) => value + 1);
  const updateDraft = (field) => (event) => setFilterDraft((current) => ({ ...current, [field]: event.target.value }));
  const updateSettingsValue = (field) => (event) => {
    setSettingsDirty(true);
    setSettingsForm((current) => ({ ...current, [field]: event.target.value }));
  };
  const signOut = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const confirmOrderStatusChange = (order, nextStatus) => {
    if (order.status === nextStatus) return;
    setConfirmAction({
      title: 'Confirm status change',
      description: `Change ${order.orderNumber} to ${formatLabel(nextStatus)}?`,
      confirmLabel: 'Update status',
      onConfirm: () => changeOrderStatus(order, nextStatus),
    });
  };

  const confirmPaymentStatusChange = (order, nextStatus) => {
    if (order.paymentStatus === nextStatus) return;
    setConfirmAction({
      title: 'Confirm payment change',
      description: `Change ${order.orderNumber} payment to ${formatLabel(nextStatus)}?`,
      confirmLabel: 'Update payment',
      onConfirm: () => changePaymentStatus(order, nextStatus),
    });
  };

  const saveProduct = async (values) => {
    try {
      setIsSavingProduct(true);
      setError('');
      if (editingProduct) {
        await updateProduct(token, editingProduct.id, values);
        pushToast(`${values.name} updated.`, 'success');
      } else {
        await createProduct(token, values);
        pushToast(`${values.name} added.`, 'success');
      }
      setEditingProduct(null);
      refresh();
    } catch (saveError) {
      setError(saveError.message);
      pushToast(saveError.message, 'danger');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      setIsSavingSettings(true);
      setError('');
      const data = await updateSiteSettings(token, settingsForm);
      setSiteSettings(data);
      setSettingsForm(data);
      setSettingsDirty(false);
      pushToast('Business settings updated.', 'success');
    } catch (saveError) {
      setError(saveError.message);
      pushToast(saveError.message, 'danger');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Order Number', 'Customer', 'Contact', 'Status', 'Payment', 'Total', 'Created At'];
    const rows = allOrders.map((order) => [order.orderNumber, order.customerName, order.contactNumber, order.status, order.paymentStatus, order.total, order.createdAt]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `print-it-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const printReceipt = (order) => {
    const popup = window.open('', '_blank', 'width=700,height=800');
    if (!popup) return;
    popup.document.write(`<html><body style="font-family:Arial;padding:32px"><h1>Print-IT Receipt</h1><p>${htmlEscape(order.orderNumber)} | ${htmlEscape(formatDateTime(order.createdAt))}</p><p>${htmlEscape(order.customerName)} | ${htmlEscape(order.contactNumber)}</p><ul>${order.items.map((item) => `<li>${htmlEscape(`${item.quantity}x ${item.productName}`)} - ${htmlEscape(formatCurrency(item.lineTotal))}</li>`).join('')}</ul><h3>Total: ${htmlEscape(formatCurrency(order.total))}</h3></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const runDelete = async (product) => {
    try {
      setWorkingId(`delete-${product.id}`);
      await deleteProduct(token, product.id);
      if (editingProduct?.id === product.id) setEditingProduct(null);
      setConfirmAction(null);
      pushToast(`${product.name} deleted.`, 'danger');
      refresh();
    } catch (deleteError) {
      setError(deleteError.message);
      pushToast(deleteError.message, 'danger');
    } finally {
      setWorkingId('');
    }
  };

  const changeOrderStatus = async (order, nextStatus) => {
    try {
      setWorkingId(`status-${order.id}`);
      await updateOrderStatus(token, order.id, nextStatus);
      setConfirmAction(null);
      pushToast(`${order.orderNumber} is now ${formatLabel(nextStatus)}.`, 'success');
      refresh();
    } catch (updateError) {
      setError(updateError.message);
      pushToast(updateError.message, 'danger');
    } finally {
      setWorkingId('');
    }
  };

  const changePaymentStatus = async (order, nextStatus) => {
    try {
      setWorkingId(`payment-${order.id}`);
      await updatePaymentStatus(token, order.id, nextStatus);
      setConfirmAction(null);
      pushToast(`${order.orderNumber} payment is now ${formatLabel(nextStatus)}.`, 'success');
      refresh();
    } catch (updateError) {
      setError(updateError.message);
      pushToast(updateError.message, 'danger');
    } finally {
      setWorkingId('');
    }
  };

  return (
    <motion.main animate={{ opacity: 1, y: 0 }} className="admin-shell" exit={{ opacity: 0, y: 16 }} initial={{ opacity: 0, y: 16 }}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="brand__badge"><Printer size={16} /></span>
          <div><strong>{siteSettings.businessName}</strong><small>Admin dashboard</small></div>
        </div>
        <nav className="admin-sidebar__nav">
          {SECTIONS.map((item) => (
            <button className={`admin-sidebar__link${section === item.id ? ' admin-sidebar__link--active' : ''}`} key={item.id} type="button" onClick={() => setSection(item.id)}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__summary">
          <span className="eyebrow">Live alerts</span>
          <strong>{alerts.length} active issues</strong>
          <p>{printOrders.length} printing requests in queue.</p>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">Protected admin</span>
            <h1>{formatLabel(section)}</h1>
            <p className="section-copy">Signed in as {user?.fullName || user?.email}.</p>
          </div>
          <div className="admin-topbar__actions">
            <div className="admin-alert-pill"><BellDot size={16} /><span>{alerts.length} alerts</span></div>
            <button className="button button--ghost button--compact" type="button" onClick={refresh}><RefreshCcw size={16} />Refresh</button>
            <button className="button button--ghost button--compact" type="button" onClick={signOut}><LogOut size={16} />Logout</button>
          </div>
        </header>

        {error ? <div className="panel error-panel">{error}</div> : null}

        {section === 'dashboard' ? (
          <>
            {summary ? <div className="stats-grid stats-grid--wide">{stats.map((card) => <div className="stat-card" key={card.label}><card.icon size={18} /><strong>{card.value}</strong><span>{card.label}</span></div>)}</div> : null}
            <div className="admin-dashboard-grid">
              <section className="panel">
                <div className="panel__header"><div><span className="eyebrow">Sales over time</span><h2>Booked value this week</h2></div></div>
                {isLoading ? <LineSkeleton count={5} /> : <div className="mini-chart">{series.map((item) => <div className="mini-chart__item" key={item.key}><div className="mini-chart__bar" style={{ height: `${Math.max((item.booked / maxBooked) * 100, item.booked ? 12 : 4)}%` }} /><strong>{formatCurrency(item.booked)}</strong><span>{item.label}</span></div>)}</div>}
              </section>
              <section className="panel">
                <div className="panel__header"><div><span className="eyebrow">Orders per day</span><h2>Activity this week</h2></div></div>
                {isLoading ? <LineSkeleton count={5} /> : <div className="mini-chart mini-chart--orders">{series.map((item) => <div className="mini-chart__item" key={`${item.key}-orders`}><div className="mini-chart__bar mini-chart__bar--orders" style={{ height: `${Math.max((item.orders / maxOrders) * 100, item.orders ? 12 : 4)}%` }} /><strong>{item.orders}</strong><span>{item.label}</span></div>)}</div>}
              </section>
            </div>
            <div className="admin-dashboard-grid admin-dashboard-grid--secondary">
              <section className="panel"><div className="panel__header"><div><span className="eyebrow">Recent orders</span><h2>Latest activity</h2></div></div>{isLoading ? <LineSkeleton count={4} /> : <div className="summary-list">{allOrders.slice(0, 4).map((order) => <article className="dashboard-order-row" key={order.id}><div><strong>{order.orderNumber}</strong><p>{order.customerName}</p></div><span className="pill">{formatLabel(order.status)}</span></article>)}</div>}</section>
              <section className="panel"><div className="panel__header"><div><span className="eyebrow">Printing queue</span><h2>Service requests</h2></div></div>{isLoading ? <LineSkeleton count={4} /> : <div className="summary-list">{printOrders.slice(0, 4).map((order) => <article className="dashboard-order-row" key={`print-${order.id}`}><div><strong>{order.orderNumber}</strong><p>{order.customerName}</p></div><span className="availability-pill">{formatLabel(order.status)}</span></article>)}</div>}</section>
              <section className="panel"><div className="panel__header"><div><span className="eyebrow">Low stock</span><h2>Products to watch</h2></div></div>{isLoading ? <LineSkeleton count={4} /> : lowStock.length ? <div className="summary-list">{lowStock.map((product) => <article className="dashboard-order-row" key={`stock-${product.id}`}><div><strong>{product.name}</strong><p>{formatProductAvailability(product)}</p></div><span className="availability-pill availability-pill--warning">Low stock</span></article>)}</div> : <div className="empty-panel empty-panel--compact"><Package size={24} /><h3>No low stock items</h3><p>Food inventory is currently in a safe range.</p></div>}</section>
            </div>
          </>
        ) : null}

        {section === 'orders' ? (
          <section className="section">
            <div className="section__header"><div><span className="eyebrow">Order management</span><h2>Track, update, export, and print receipts</h2></div><button className="button button--ghost button--compact" type="button" onClick={exportCsv}><Download size={16} />Export CSV</button></div>
            <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setFilters(filterDraft); }}>
              <div className="field"><label htmlFor="orderSearch">Search</label><input id="orderSearch" placeholder="Order number, customer, or contact" value={filterDraft.search} onChange={updateDraft('search')} /></div>
              <div className="field"><label htmlFor="orderStatusFilter">Order status</label><select id="orderStatusFilter" value={filterDraft.status} onChange={updateDraft('status')}><option value="">All statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></div>
              <div className="field"><label htmlFor="paymentStatusFilter">Payment status</label><select id="paymentStatusFilter" value={filterDraft.paymentStatus} onChange={updateDraft('paymentStatus')}><option value="">All payment states</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></div>
              <div className="field"><label htmlFor="dateFrom">Date from</label><input id="dateFrom" type="date" value={filterDraft.dateFrom} onChange={updateDraft('dateFrom')} /></div>
              <div className="field"><label htmlFor="dateTo">Date to</label><input id="dateTo" type="date" value={filterDraft.dateTo} onChange={updateDraft('dateTo')} /></div>
              <div className="admin-filter-actions"><button className="button button--primary" type="submit">Apply</button><button className="button button--ghost" type="button" onClick={() => { setFilterDraft(DEFAULT_FILTERS); setFilters(DEFAULT_FILTERS); }}>Reset</button></div>
            </form>
            {isLoading ? <LineSkeleton count={7} /> : null}
            {!isLoading && !orders.length ? <div className="empty-panel empty-panel--compact"><ReceiptText size={24} /><h3>No orders matched</h3><p>Try clearing the current filters.</p></div> : null}
            {!isLoading && orders.length ? <div className="order-feed order-feed--single">{orders.map((order) => <article className="order-card order-card--detailed" key={order.id}><div className="order-card__head"><div><div className="card-tag-row"><span className="pill">{formatLabel(order.status)}</span><span className={`availability-pill${order.paymentStatus === 'paid' ? '' : ' availability-pill--warning'}`}>{formatLabel(order.paymentStatus)}</span>{order.paymentProofUrl ? <span className="availability-pill">Proof uploaded</span> : null}</div><h3>{order.orderNumber}</h3><p>{order.customerName} | {formatDateTime(order.createdAt)}</p></div><strong>{formatCurrency(order.total)}</strong></div><div className="order-card__meta"><span>{order.contactNumber}</span><span>{formatLabel(order.fulfillmentMethod)}</span><span>{formatPaymentLabel(order.paymentMethod)}</span><span>{order.email || 'No email'}</span></div>{order.paymentProofUrl ? <div className="inline-actions"><a className="button button--ghost button--compact" href={resolveMediaUrl(order.paymentProofUrl)} rel="noreferrer" target="_blank"><Eye size={16} />Open payment proof</a>{order.paymentProofUploadedAt ? <span className="summary-item__note">Uploaded {formatDateTime(order.paymentProofUploadedAt)}</span> : null}</div> : null}<OrderTimeline events={order.events.slice(-4)} paymentStatus={order.paymentStatus} status={order.status} /><div className="order-card__controls"><div className="field field--compact"><label htmlFor={`order-status-${order.id}`}>Update status</label><select id={`order-status-${order.id}`} disabled={workingId === `status-${order.id}`} value={order.status} onChange={(event) => confirmOrderStatusChange(order, event.target.value)}>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></div><div className="field field--compact"><label htmlFor={`payment-status-${order.id}`}>Update payment</label><select id={`payment-status-${order.id}`} disabled={workingId === `payment-${order.id}`} value={order.paymentStatus} onChange={(event) => confirmPaymentStatusChange(order, event.target.value)}>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></div><div className="inline-actions"><Link className="button button--ghost button--compact" to={`/orders/${order.trackingToken}`}><Eye size={16} />Public view</Link><button className="button button--ghost button--compact" type="button" onClick={() => printReceipt(order)}><ReceiptText size={16} />Receipt</button></div></div><div className="order-card__items order-card__items--stacked">{order.items.map((item) => <div className="order-card__item-row" key={item.id}><div className="order-card__item"><span>{item.quantity}x {item.productName}</span></div><ServiceChips details={item.serviceDetails} showFileLink /></div>)}</div>{order.notes ? <p className="summary-item__note">{order.notes}</p> : null}</article>)}</div> : null}
          </section>
        ) : null}

        {section === 'products' ? (
          <section className="admin-layout">
            <AdminProductForm key={editingProduct?.id || 'new'} isSaving={isSavingProduct} product={editingProduct} token={token} onCancel={() => setEditingProduct(null)} onSubmit={saveProduct} />
            <div className="panel">
              <div className="panel__header"><div><span className="eyebrow">Catalog</span><h2>Manage live products</h2></div></div>
              {isLoading ? <ProductGridSkeleton count={3} /> : <div className="admin-product-list">{products.map((product) => <article className="admin-product-card" key={product.id}><img alt={product.name} src={resolveMediaUrl(product.image)} /><div className="admin-product-card__body"><div><div className="card-tag-row"><span className="pill">{product.category}</span><span className={`availability-pill${product.isActive ? '' : ' availability-pill--danger'}`}>{product.isActive ? 'Visible' : 'Hidden'}</span>{product.category === 'Food' && product.stockQuantity !== null && product.stockQuantity <= 5 ? <span className="availability-pill availability-pill--warning">Low stock</span> : null}</div><h3>{product.name}</h3><p>{product.description}</p><div className="card-tag-row">{formatProductAvailability(product) ? <span className="availability-pill">{formatProductAvailability(product)}</span> : null}</div></div><strong>{formatCurrency(product.price)}</strong></div><div className="admin-product-card__actions"><button className="button button--ghost" type="button" onClick={() => setEditingProduct(product)}>Edit</button><button className="button button--ghost" disabled={workingId === `toggle-${product.id}`} type="button" onClick={async () => { try { setWorkingId(`toggle-${product.id}`); await updateProductActive(token, product.id, !product.isActive); pushToast(`${product.name} updated.`, 'success'); refresh(); } catch (toggleError) { setError(toggleError.message); } finally { setWorkingId(''); } }}>{workingId === `toggle-${product.id}` ? 'Updating...' : product.isActive ? 'Hide' : 'Show'}</button><button className="button button--danger" type="button" onClick={() => setConfirmAction({ title: 'Delete product?', description: `Delete ${product.name}? Existing order history will remain.`, confirmLabel: 'Delete product', onConfirm: () => runDelete(product) })}><Trash2 size={16} />Delete</button></div></article>)}</div>}
            </div>
          </section>
        ) : null}

        {section === 'reports' ? (
          <section className="admin-dashboard-grid admin-dashboard-grid--secondary">
            <section className="panel"><div className="panel__header"><div><span className="eyebrow">Revenue report</span><h2>Daily, weekly, monthly</h2></div></div><div className="summary-list"><article className="dashboard-order-row"><div><strong>Paid today</strong><p>Confirmed payments only</p></div><span>{formatCurrency(summary?.paidToday || 0)}</span></article><article className="dashboard-order-row"><div><strong>Paid this week</strong><p>Last 7 days</p></div><span>{formatCurrency(summary?.paidThisWeek || 0)}</span></article><article className="dashboard-order-row"><div><strong>Paid this month</strong><p>Last 30 days</p></div><span>{formatCurrency(summary?.paidThisMonth || 0)}</span></article></div><div className="inline-actions"><button className="button button--primary" type="button" onClick={exportCsv}><Download size={16} />Export orders</button></div></section>
            <section className="panel"><div className="panel__header"><div><span className="eyebrow">Best sellers</span><h2>Top products</h2></div></div>{isLoading ? <LineSkeleton count={5} /> : topProducts.length ? <div className="summary-list">{topProducts.map((item) => <article className="dashboard-order-row" key={item.name}><div><strong>{item.name}</strong><p>{item.quantity} units sold</p></div><span>{formatCurrency(item.revenue)}</span></article>)}</div> : <div className="empty-panel empty-panel--compact"><BarChart3 size={24} /><h3>No sales data yet</h3><p>Reports will appear once orders are placed.</p></div>}</section>
          </section>
        ) : null}

        {section === 'settings' ? (
          <form className="panel settings-form" onSubmit={saveSettings}>
            <div className="panel__header"><div><span className="eyebrow">Business settings</span><h2>Update public site content</h2></div></div>
            <div className="form-grid"><div className="field"><label htmlFor="businessName">Business name</label><input id="businessName" value={settingsForm.businessName} onChange={updateSettingsValue('businessName')} /></div><div className="field"><label htmlFor="contactPhone">Contact phone</label><input id="contactPhone" value={settingsForm.contactPhone} onChange={updateSettingsValue('contactPhone')} /></div></div>
            <div className="field"><label htmlFor="heroHeadline">Hero headline</label><input id="heroHeadline" value={settingsForm.heroHeadline} onChange={updateSettingsValue('heroHeadline')} /></div>
            <div className="field"><label htmlFor="heroSubtext">Hero subtext</label><textarea id="heroSubtext" rows="4" value={settingsForm.heroSubtext} onChange={updateSettingsValue('heroSubtext')} /></div>
            <div className="field"><label htmlFor="aboutSummary">About summary</label><textarea id="aboutSummary" rows="5" value={settingsForm.aboutSummary} onChange={updateSettingsValue('aboutSummary')} /></div>
            <div className="form-grid"><div className="field"><label htmlFor="contactEmail">Contact email</label><input id="contactEmail" type="email" value={settingsForm.contactEmail} onChange={updateSettingsValue('contactEmail')} /></div><div className="field"><label htmlFor="contactFacebook">Facebook link</label><input id="contactFacebook" value={settingsForm.contactFacebook} onChange={updateSettingsValue('contactFacebook')} /></div></div>
            <div className="field"><label htmlFor="contactLocation">Location</label><input id="contactLocation" value={settingsForm.contactLocation} onChange={updateSettingsValue('contactLocation')} /></div>
            <div className="admin-form__actions"><button className="button button--primary" disabled={isSavingSettings} type="submit">{isSavingSettings ? 'Saving...' : 'Save settings'}</button><button className="button button--ghost" disabled={!settingsDirty || isSavingSettings} type="button" onClick={() => { setSettingsForm(siteSettings); setSettingsDirty(false); }}>Reset</button></div>
          </form>
        ) : null}
      </section>

      <ConfirmModal confirmLabel={confirmAction?.confirmLabel} description={confirmAction?.description} isLoading={Boolean(confirmAction && workingId)} isOpen={Boolean(confirmAction)} title={confirmAction?.title} onClose={() => setConfirmAction(null)} onConfirm={() => confirmAction?.onConfirm?.()} />
      {toasts.length ? <div className="toast-stack">{toasts.map((toast) => <div className={`toast toast--${toast.tone}`} key={toast.id}>{toast.message}</div>)}</div> : null}
    </motion.main>
  );
}

export default AdminPage;
