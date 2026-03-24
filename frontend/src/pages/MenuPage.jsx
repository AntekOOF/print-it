import { motion } from 'framer-motion';
import CatalogSection from '../components/CatalogSection.jsx';
import { useProducts } from '../hooks/useProducts.js';

function MenuPage({ onCartOpen }) {
  const { error, isLoading, products } = useProducts();

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="page-hero">
        <span className="eyebrow">Menu</span>
        <h1>Choose snacks, review print options, and build the cart.</h1>
        <p>
          Food and service products stay dynamic, so the menu can keep growing without hardcoded cards.
        </p>
      </section>

      <CatalogSection
        description="Filter by food or services, open each product card, and add customized print jobs or snack items into the same cart."
        eyebrow="Dynamic Catalog"
        error={error}
        isLoading={isLoading}
        onCartOpen={onCartOpen}
        products={products}
        title="Our current menu"
      />
    </motion.main>
  );
}

export default MenuPage;
