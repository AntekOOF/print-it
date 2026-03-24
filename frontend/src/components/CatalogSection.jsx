import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';
import { ProductGridSkeleton } from './LoadingSkeleton.jsx';

const CATEGORY_FILTERS = ['All', 'Food', 'Services'];

function CatalogSection({
  cta,
  description,
  eyebrow,
  error,
  isLoading,
  products,
  previewCount,
  title,
  onCartOpen,
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = useMemo(() => {
    const nextProducts =
      selectedCategory === 'All' ? products : products.filter((product) => product.category === selectedCategory);

    return previewCount ? nextProducts.slice(0, previewCount) : nextProducts;
  }, [previewCount, products, selectedCategory]);

  return (
    <section className="section">
      <div className="section__header section__header--stack">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          {description ? <p className="section-copy">{description}</p> : null}
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
      {isLoading ? <ProductGridSkeleton count={previewCount || 3} /> : null}

      {!isLoading && !error ? (
        <>
          <div className="product-grid">
            {filteredProducts.map((product, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 16 }}
                key={product.id}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} onSelect={setSelectedProduct} />
              </motion.div>
            ))}
          </div>

          {cta ? (
            <div className="section__actions">
              <Link className="button button--ghost" to={cta.to}>
                {cta.label}
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : null}
        </>
      ) : null}

      <ProductModal
        isOpen={Boolean(selectedProduct)}
        product={selectedProduct}
        onAdded={onCartOpen}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}

export default CatalogSection;
