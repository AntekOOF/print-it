import { motion } from 'framer-motion';
import { FileText, Palette, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import CatalogSection from '../components/CatalogSection.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { formatCurrency } from '../lib/formatters.js';

const SERVICE_CARDS = [
  {
    icon: Printer,
    title: 'Black & White Printing',
    description: 'Best for reviewers, worksheets, forms, and straightforward school documents.',
  },
  {
    icon: Palette,
    title: 'Colored Printing',
    description: 'Useful for org materials, posters, covers, and layouts that need stronger visual clarity.',
  },
  {
    icon: FileText,
    title: 'Document Services',
    description: 'Paper size, print side, finish, and upload options for more customized requests.',
  },
];

function ServicesPage({ onCartOpen }) {
  const { error, isLoading, products } = useProducts();
  const serviceProduct = products.find((product) => product.category === 'Services');

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page page--public"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="page-hero page-hero--hero-card">
        <span className="eyebrow">Services</span>
        <h1>Printing requests with a cleaner, more detailed workflow.</h1>
        <p>
          Customers can upload files, choose print type, set quantity, add notes, and send everything through the same
          order system used for food items.
        </p>
      </section>

      <section className="service-highlight-grid">
        {SERVICE_CARDS.map((service) => (
          <article className="panel service-highlight" key={service.title}>
            <div className="service-highlight__icon">
              <service.icon size={20} />
            </div>
            <div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
            <strong>{serviceProduct ? `From ${formatCurrency(serviceProduct.price)} / page` : 'Custom pricing'}</strong>
          </article>
        ))}
      </section>

      <CatalogSection
        cta={{ label: 'View all products', to: '/products' }}
        defaultCategory="Services"
        description="Open the service card to start the actual print request with file upload and special instructions."
        emptyDescription="Add a Services-category product from admin to enable the print request flow here."
        eyebrow="Printing catalog"
        error={error}
        hideFilters
        isLoading={isLoading}
        onCartOpen={onCartOpen}
        products={products}
        title="Available print service products"
      />

      <section className="panel panel--cta">
        <span className="eyebrow">Ready to submit</span>
        <h2>Use the product modal to upload files and send a printable request.</h2>
        <div className="inline-actions">
          <Link className="button button--primary" to="/products">
            Open catalog
          </Link>
          <Link className="button button--ghost" to="/track-order">
            Track a request
          </Link>
        </div>
      </section>
    </motion.main>
  );
}

export default ServicesPage;
