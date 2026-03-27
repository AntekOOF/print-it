import { motion } from 'framer-motion';
import { ArrowRight, Printer, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import CatalogSection from '../components/CatalogSection.jsx';
import { useProducts } from '../hooks/useProducts.js';

function ProductsPage({ onCartOpen }) {
  const { error, isLoading, products } = useProducts();

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page page--public"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="page-hero page-hero--hero-card">
        <span className="eyebrow">Products</span>
        <h1>Food items and printing services in one live catalog.</h1>
        <p>
          Browse the full product system, open each card, and build an order without relying on hardcoded menu items.
        </p>
        <div className="inline-actions">
          <Link className="button button--primary" to="/checkout">
            <ShoppingBag size={16} />
            Order now
          </Link>
          <Link className="button button--ghost" to="/services">
            <Printer size={16} />
            View services
          </Link>
        </div>
      </section>

      <CatalogSection
        cta={{ label: 'Explore printing services', to: '/services' }}
        description="Use the category pills to switch between food and services, then open any card for quantity and customization."
        eyebrow="Live product system"
        error={error}
        isLoading={isLoading}
        onCartOpen={onCartOpen}
        products={products}
        title="Current storefront catalog"
      />

      <section className="section section--split">
        <div className="panel panel--highlight">
          <span className="eyebrow">Built to scale</span>
          <h2>The product system is ready for more categories later.</h2>
          <p>
            Admin can add or hide products from the dashboard, update stock levels, and expand the catalog without
            editing frontend code.
          </p>
        </div>

        <div className="panel panel--dark-callout">
          <span className="eyebrow">Need printing?</span>
          <h2>Open the service cards for upload and print customization.</h2>
          <p>File upload, print type, paper size, finish, and special instructions all stay inside the same flow.</p>
          <Link className="button button--ghost" to="/services">
            View services
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </motion.main>
  );
}

export default ProductsPage;
