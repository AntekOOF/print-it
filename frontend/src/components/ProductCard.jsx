import { motion } from 'framer-motion';
import { Eye, Printer, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../hooks/useCart.js';
import { formatCurrency, formatProductAvailability } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';
import QuantitySelector from './QuantitySelector.jsx';

function ProductCard({ onAdded, onSelect, product }) {
  const isService = product.category === 'Services';
  const isUnavailable = product.category === 'Food' && product.stockQuantity === 0;
  const availabilityLabel = formatProductAvailability(product);
  const maxQuantity =
    product.category === 'Food' && product.stockQuantity !== null && product.stockQuantity !== undefined
      ? Math.max(1, product.stockQuantity)
      : 999;
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleCardAction = () => {
    if (isUnavailable) {
      return;
    }

    if (isService) {
      onSelect(product, quantity);
      return;
    }

    addItem(product, quantity);
    onAdded?.();
  };

  return (
    <motion.article
      className={`product-card${isUnavailable ? ' product-card--disabled' : ''}`}
      whileHover={isUnavailable ? undefined : { y: -8, scale: 1.01 }}
      whileTap={isUnavailable ? undefined : { scale: 0.99 }}
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
          <strong className="product-card__price">{formatCurrency(product.price)}</strong>
        </div>

        <div className="product-card__copy">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>

        {availabilityLabel ? <div className="availability-pill">{availabilityLabel}</div> : null}

        <div className="product-card__controls">
          <div className="product-card__quantity">
            <span>Quantity</span>
            <QuantitySelector max={maxQuantity} value={quantity} onChange={setQuantity} />
          </div>

          <div className="product-card__actions">
            <button
              className="button button--ghost button--compact"
              type="button"
              onClick={() => onSelect(product, quantity)}
            >
              <Eye size={16} />
              Details
            </button>

            <button
              className="button button--primary button--compact"
              disabled={isUnavailable}
              type="button"
              onClick={handleCardAction}
            >
              <ShoppingBag size={16} />
              {isUnavailable ? 'Unavailable' : isService ? 'Customize & add' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
