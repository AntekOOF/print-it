import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, GalleryVerticalEnd, ShieldCheck, TicketCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandArtwork from '../components/BrandArtwork.jsx';
import CatalogSection from '../components/CatalogSection.jsx';
import { useProducts } from '../hooks/useProducts.js';

const STORY_POINTS = [
  {
    icon: BadgeCheck,
    title: 'Account-based checkout',
    description: 'Customers sign in before ordering, which keeps orders tied to a real account and reduces spam.',
  },
  {
    icon: TicketCheck,
    title: 'Trackable confirmations',
    description: 'Every order still gets a public summary page, plus customers can revisit their own order history.',
  },
  {
    icon: ShieldCheck,
    title: 'Admin-ready operations',
    description: 'Products, order status, payment state, and availability stay manageable from one dashboard.',
  },
];

function HomePage({ onCartOpen }) {
  const { error, isLoading, products } = useProducts();

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35 }}
    >
      <section className="hero hero--split">
        <div className="hero__copy hero__copy--wide">
          <span className="eyebrow">Prints, snacks, and order confirmation</span>
          <h1>Print-IT brings fast campus orders into one clean storefront.</h1>
          <p>
            Browse the menu, customize printing jobs, sign in with a customer account, and keep every order tied to a
            real identity for cleaner confirmations and less dummy traffic.
          </p>

          <div className="hero__actions">
            <Link className="button button--primary" to="/menu">
              Explore the menu
              <ArrowRight size={16} />
            </Link>
            <Link className="button button--ghost" to="/signup">
              Create customer account
            </Link>
          </div>

          <div className="feature-strip">
            {STORY_POINTS.map((point) => (
              <article className="feature-strip__card" key={point.title}>
                <point.icon size={18} />
                <div>
                  <h3>{point.title}</h3>
                  <p>{point.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="hero__visual hero__visual--showcase">
          <BrandArtwork />
        </div>
      </section>

      <section className="section section--split section--balanced">
        <div className="panel panel--highlight">
          <span className="eyebrow">Why it works</span>
          <h2>One storefront for food pickups, custom prints, and customer confirmation.</h2>
          <p>
            The public experience is now split into a proper homepage, menu, gallery, and about page so customers can
            learn the brand first, then order with confidence.
          </p>
        </div>

        <div className="stacked-panels">
          <div className="panel">
            <span className="eyebrow">Gallery-ready brand</span>
            <h3>Inspired by your references, but rebuilt for Print-IT.</h3>
            <p>
              The layout keeps the approachable multi-page flow you wanted, while the visuals shift into a neon print
              identity that matches your own logo direction.
            </p>
          </div>

          <div className="panel">
            <span className="eyebrow">Customer account flow</span>
            <h3>Sign up, log in, order, and revisit confirmations later.</h3>
            <p>
              Checkout is protected by account login so orders are attached to real users instead of anonymous guest
              submissions.
            </p>
          </div>
        </div>
      </section>

      <CatalogSection
        cta={{ label: 'View full menu', to: '/menu' }}
        description="Start with the food items and printing options already in the database. The full menu page keeps the same dynamic catalog and product modal flow."
        eyebrow="Menu Preview"
        error={error}
        isLoading={isLoading}
        onCartOpen={onCartOpen}
        previewCount={3}
        products={products}
        title="Featured menu items"
      />

      <section className="section section--split">
        <div className="panel panel--gallery-callout">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Gallery</span>
              <h2>Show the real energy behind the orders</h2>
            </div>
          </div>
          <p>
            Use the gallery page for event snapshots, product tables, print pickups, or campaign moments that make the
            storefront feel active and trustworthy.
          </p>
          <Link className="button button--ghost" to="/gallery">
            <GalleryVerticalEnd size={16} />
            Open gallery
          </Link>
        </div>

        <div className="panel panel--dark-callout">
          <span className="eyebrow">Trackable order flow</span>
          <h2>Every order still gets a public tracking link.</h2>
          <p>
            Even with customer login required for checkout, customers can still use their order page to review details,
            continue payment, and check status updates.
          </p>
          <Link className="button button--primary" to="/track-order">
            <TicketCheck size={16} />
            Track an order
          </Link>
        </div>
      </section>
    </motion.main>
  );
}

export default HomePage;
