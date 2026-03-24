import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, Printer, ShoppingBag, Sparkles, TicketCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import ProductModal from '../components/ProductModal.jsx';
import { ProductGridSkeleton } from '../components/LoadingSkeleton.jsx';
import { getProducts } from '../lib/api.js';

const CATEGORY_FILTERS = ['All', 'Food', 'Services'];

function HomePage({ onCartOpen }) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getProducts();

        if (!ignore) {
          setProducts(data);
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

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredProducts =
    selectedCategory === 'All' ? products : products.filter((product) => product.category === selectedCategory);

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35 }}
    >
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Small business ordering system</span>
          <h1>Food orders, custom prints, and GCash-ready checkout in one flow.</h1>
          <p>
            Print-IT keeps snack orders and document requests in a single storefront, with mobile-first ordering,
            public tracking, and an admin dashboard for inventory and status updates.
          </p>

          <div className="hero__actions">
            <button
              className="button button--primary"
              type="button"
              onClick={() => window.scrollTo({ top: 640, behavior: 'smooth' })}
            >
              Explore products
              <ArrowRight size={16} />
            </button>
            <button className="button button--ghost" type="button" onClick={onCartOpen}>
              <ShoppingBag size={16} />
              Open cart
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <Sparkles size={18} />
              <strong>{products.length || 3}</strong>
              <span>Dynamic catalog items</span>
            </div>
            <div className="stat-card">
              <Printer size={18} />
              <strong>Configurable</strong>
              <span>Paper, color, side, and finish options</span>
            </div>
            <div className="stat-card">
              <CreditCard size={18} />
              <strong>GCash</strong>
              <span>Online checkout session support</span>
            </div>
          </div>
        </div>

        <div className="hero__visual panel">
          <div className="hero__card hero__card--accent">
            <span>Customer flow</span>
            <h3>Pick items, upload print files, and submit once</h3>
            <p>Cart, checkout, public order tracking, and payment retry all happen from the same storefront.</p>
          </div>
          <div className="hero__card">
            <span>Operations</span>
            <h3>Admin tools for products and order states</h3>
            <p>Manage availability, stock, service settings, filters, and fulfillment updates without hardcoding.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow">Catalog</span>
            <h2>Menu and service list</h2>
          </div>

          <div className="filter-tabs" role="tablist" aria-label="Filter products by category">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                className={`filter-tabs__button${selectedCategory === category ? ' filter-tabs__button--active' : ''}`}
                type="button"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="panel error-panel">{error}</div> : null}
        {isLoading ? <ProductGridSkeleton count={3} /> : null}

        {!isLoading && !error ? (
          <div className="product-grid">
            {filteredProducts.map((product, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 16 }}
                key={product.id}
                transition={{ delay: index * 0.06 }}
              >
                <ProductCard product={product} onSelect={setSelectedProduct} />
              </motion.div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="section section--split">
        <div className="panel">
          <span className="eyebrow">Printing service workflow</span>
          <h2>Upload files with the order itself</h2>
          <p>
            The print service stores the uploaded file reference, print type, paper size, color mode, side, finish,
            and notes so staff can process it cleanly from the dashboard.
          </p>
        </div>

        <div className="panel">
          <span className="eyebrow">Track and pay later</span>
          <h2>Public order status and GCash continuation</h2>
          <p>
            Customers can look up an order by order number and contact number, then reopen the order page to continue
            GCash payment or monitor fulfillment.
          </p>
          <div className="inline-actions">
            <Link className="button button--ghost" to="/track-order">
              <TicketCheck size={16} />
              Track an order
            </Link>
          </div>
        </div>
      </section>

      <ProductModal
        isOpen={Boolean(selectedProduct)}
        product={selectedProduct}
        onAdded={onCartOpen}
        onClose={() => setSelectedProduct(null)}
      />
    </motion.main>
  );
}

export default HomePage;
