import { motion } from 'framer-motion';
import { ArrowUpRight, Printer, UtensilsCrossed } from 'lucide-react';
import { formatCurrency, formatProductAvailability } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';

function ProductCard({ product, onSelect }) {
  const isService = product.category === 'Services';
  const isUnavailable = product.category === 'Food' && product.stockQuantity === 0;
  const availabilityLabel = formatProductAvailability(product);

  return (
    <motion.button
      className={`product-card${isUnavailable ? ' product-card--disabled' : ''}`}
      disabled={isUnavailable}
      type="button"
      whileHover={isUnavailable ? undefined : { y: -8, scale: 1.01 }}
      whileTap={isUnavailable ? undefined : { scale: 0.99 }}
      onClick={() => onSelect(product)}
    >
      <div className="product-card__media">
        <img alt={product.name} src={resolveMediaUrl(product.image)} />
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="pill">
            {isService ? <Printer size={14} /> : <UtensilsCrossed size={14} />}
            {product.category}
          </span>
          <strong>{formatCurrency(product.price)}</strong>
        </div>

        <div className="product-card__copy">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>

        {availabilityLabel ? <div className="availability-pill">{availabilityLabel}</div> : null}

        <div className="product-card__footer">
          <span>{isUnavailable ? 'Unavailable today' : isService ? 'Customize service' : 'Add to cart'}</span>
          {!isUnavailable ? <ArrowUpRight size={16} /> : null}
        </div>
      </div>
    </motion.button>
  );
}

export default ProductCard;
