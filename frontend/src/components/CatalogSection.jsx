import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';
import { ProductGridSkeleton } from './LoadingSkeleton.jsx';

const CATEGORY_FILTERS = ['All', 'Food', 'Services'];

function CatalogSection({
  categoryOptions = CATEGORY_FILTERS,
  cta,
  defaultCategory = 'All',
  description,
  emptyDescription = 'No products matched the current category yet.',
  emptyTitle = 'Nothing to show yet',
  eyebrow,
  error,
  filtersVariant = 'tabs',
  hideFilters = false,
  isLoading,
  onCartOpen,
  products,
  previewCount,
  title,
}) {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [areFiltersExpanded, setAreFiltersExpanded] = useState(filtersVariant !== 'collapsible');

  useEffect(() => {
    setSelectedCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    setAreFiltersExpanded(filtersVariant !== 'collapsible');
  }, [filtersVariant]);

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

        {!hideFilters && categoryOptions.length > 1 ? (
          filtersVariant === 'collapsible' ? (
            <div className="filter-menu">
              <button
                aria-expanded={areFiltersExpanded}
                className="filter-menu__toggle"
                type="button"
                onClick={() => setAreFiltersExpanded((currentState) => !currentState)}
              >
                <span>
                  <SlidersHorizontal size={16} />
                  Browse categories
                </span>
                <strong>{selectedCategory}</strong>
                <ChevronDown size={16} />
              </button>

              {areFiltersExpanded ? (
                <div className="filter-tabs" role="tablist" aria-label="Filter products by category">
                  {categoryOptions.map((category) => (
                    <button
                      key={category}
                      className={`filter-tabs__button${selectedCategory === category ? ' filter-tabs__button--active' : ''}`}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category);
                        setAreFiltersExpanded(false);
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="filter-tabs" role="tablist" aria-label="Filter products by category">
              {categoryOptions.map((category) => (
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
          )
        ) : null}
      </div>

      {error ? <div className="panel error-panel">{error}</div> : null}
      {isLoading ? <ProductGridSkeleton count={previewCount || 3} /> : null}

      {!isLoading && !error ? (
        <>
          {filteredProducts.length ? (
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
          ) : (
            <div className="empty-panel empty-panel--compact">
              <h3>{emptyTitle}</h3>
              <p>{emptyDescription}</p>
              {selectedCategory !== 'All' ? (
                <button className="button button--ghost button--compact" type="button" onClick={() => setSelectedCategory('All')}>
                  Show all products
                </button>
              ) : null}
            </div>
          )}

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
