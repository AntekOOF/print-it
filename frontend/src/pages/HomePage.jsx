import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  CreditCard,
  Printer,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandArtwork from '../components/BrandArtwork.jsx';
import CatalogSection from '../components/CatalogSection.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { useSiteSettings } from '../hooks/useSiteSettings.js';
import { formatCurrency } from '../lib/formatters.js';

const TRUST_POINTS = [
  {
    icon: BadgeCheck,
    title: 'Student-friendly pricing',
    description: 'Affordable snacks and accessible print jobs designed for campus budgets and org events.',
  },
  {
    icon: ShieldCheck,
    title: 'Account-linked orders',
    description: 'Customer signup and login help reduce dummy submissions and keep confirmations tied to real accounts.',
  },
  {
    icon: TicketCheck,
    title: 'Trackable updates',
    description: 'Every order gets a public tracking page plus a full timeline that customers can revisit anytime.',
  },
];

const SERVICE_HIGHLIGHTS = [
  {
    icon: Printer,
    title: 'Black & White Printing',
    description: 'Fast everyday printing for reviewers, handouts, and standard documents.',
  },
  {
    icon: Sparkles,
    title: 'Colored Printing',
    description: 'Presentation-ready prints for org materials, posters, and class visuals.',
  },
  {
    icon: CreditCard,
    title: 'Document Services',
    description: 'Flexible paper size, finish, and upload options for requests that need more control.',
  },
];

const WHY_CHOOSE_US = [
  {
    icon: Wallet,
    title: 'Affordable prices',
    description: 'Built around practical student spending, not inflated retail pricing.',
  },
  {
    icon: Sparkles,
    title: 'Clean ordering flow',
    description: 'One storefront for snacks, print requests, payment choice, and order tracking.',
  },
  {
    icon: Clock3,
    title: 'Fast service',
    description: 'Designed for quick pickup coordination and clear status updates from admin.',
  },
  {
    icon: TicketCheck,
    title: 'Order confidence',
    description: 'Customers can check confirmations, payment status, and progress without messaging manually.',
  },
];

const ORDER_STEPS = [
  {
    step: '01',
    title: 'Browse products',
    description: 'Review snacks, printing services, and the latest availability from the live catalog.',
  },
  {
    step: '02',
    title: 'Customize the order',
    description: 'Choose quantity, upload print files, add instructions, and pick payment plus pickup or delivery.',
  },
  {
    step: '03',
    title: 'Confirm and track',
    description: 'Submit the order, get an order ID, and follow progress from pending through completion.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Alyssa, STEM Student',
    quote: 'The print request flow feels more organized than messaging everything by hand, and the order page makes follow-up easy.',
  },
  {
    name: 'Marco, Student Officer',
    quote: 'We used it for both document printing and snack pickup during event week. The process felt fast and clear.',
  },
  {
    name: 'Janelle, Campus Customer',
    quote: 'I like that I can log in, place the order once, and still check the status later without asking for updates.',
  },
];

function HomePage({ onCartOpen }) {
  const { error, isLoading, products } = useProducts();
  const { settings } = useSiteSettings();
  const printingProduct = products.find((product) => product.category === 'Services');

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page page--public"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35 }}
    >
      <section className="hero hero--startup">
        <div className="hero__copy hero__copy--wide">
          <span className="eyebrow">Student-led snacks, prints, and order tracking</span>
          <h1>{settings.heroHeadline}</h1>
          <p>{settings.heroSubtext}</p>

          <div className="hero__actions">
            <Link className="button button--primary" to="/products">
              Order now
              <ArrowRight size={16} />
            </Link>
            <Link className="button button--ghost" to="/products">
              View products
            </Link>
          </div>

          <div className="hero-badges">
            <span className="hero-badges__item">Dark modern UI</span>
            <span className="hero-badges__item">Customer accounts</span>
            <span className="hero-badges__item">Trackable orders</span>
          </div>
        </div>

        <div className="hero__visual hero__visual--showcase">
          <BrandArtwork />
        </div>
      </section>

      <section className="feature-strip feature-strip--single-row">
        {TRUST_POINTS.map((point) => (
          <motion.article
            className="feature-strip__card"
            initial={{ opacity: 0, y: 18 }}
            key={point.title}
            transition={{ duration: 0.28 }}
            viewport={{ once: true, amount: 0.3 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <point.icon size={18} />
            <div>
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </div>
          </motion.article>
        ))}
      </section>

      <CatalogSection
        cta={{ label: 'Browse full catalog', to: '/products' }}
        description="Start with the current database-backed product list. Snack products stay dynamic, and the printing service card still opens the full customization flow."
        eyebrow="Products"
        error={error}
        filtersVariant="collapsible"
        isLoading={isLoading}
        onCartOpen={onCartOpen}
        previewCount={3}
        products={products}
        title="Popular orders right now"
      />

      <section className="section">
        <div className="section__header section__header--stack">
          <div>
            <span className="eyebrow">Services</span>
            <h2>Printing options built for everyday school needs</h2>
            <p className="section-copy">
              Use the printing flow for documents, colored layouts, and upload-based custom requests.
            </p>
          </div>
        </div>

        <div className="service-highlight-grid">
          {SERVICE_HIGHLIGHTS.map((service) => (
            <motion.article
              className="panel service-highlight"
              initial={{ opacity: 0, y: 18 }}
              key={service.title}
              transition={{ duration: 0.28 }}
              viewport={{ once: true, amount: 0.25 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="service-highlight__icon">
                <service.icon size={20} />
              </div>
              <div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <strong>{printingProduct ? `From ${formatCurrency(printingProduct.price)} / page` : 'Custom quote'}</strong>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section section--split section--balanced">
        <div className="panel panel--highlight">
          <span className="eyebrow">Why choose us</span>
          <h2>Built to feel like a real student startup, not a basic order form.</h2>
          <p>
            Print-IT blends snack sales, printing requests, customer accounts, and order tracking into one experience
            that feels polished enough to grow with the business.
          </p>
        </div>

        <div className="trust-grid">
          {WHY_CHOOSE_US.map((item) => (
            <article className="panel trust-card" key={item.title}>
              <div className="story-card__icon">
                <item.icon size={18} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__header section__header--stack">
          <div>
            <span className="eyebrow">How ordering works</span>
            <h2>Simple for customers, organized for admin</h2>
          </div>
        </div>

        <div className="journey-grid">
          {ORDER_STEPS.map((item) => (
            <article className="panel journey-card" key={item.step}>
              <span className="journey-card__step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--split">
        <div className="panel panel--dark-callout">
          <span className="eyebrow">About Print-IT</span>
          <h2>{settings.businessName} is a student-led business with a clear, practical mission.</h2>
          <p>{settings.aboutSummary}</p>
          <div className="inline-actions">
            <Link className="button button--primary" to="/about">
              Learn more
            </Link>
            <Link className="button button--ghost" to="/contact">
              Contact us
            </Link>
          </div>
        </div>

        <div className="panel panel--gallery-callout">
          <span className="eyebrow">Order confidence</span>
          <h2>Need a status update later?</h2>
          <p>
            Customers can open the tracking page with their order ID and contact number, then review progress, payment
            state, and fulfillment details.
          </p>
          <Link className="button button--ghost" to="/track-order">
            Track an order
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header section__header--stack">
          <div>
            <span className="eyebrow">Testimonials</span>
            <h2>Early trust signals for the brand</h2>
          </div>
        </div>

        <div className="testimonial-grid">
          {TESTIMONIALS.map((testimonial) => (
            <article className="panel testimonial-card" key={testimonial.name}>
              <p>&ldquo;{testimonial.quote}&rdquo;</p>
              <strong>{testimonial.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel--cta panel--contact-cta">
        <span className="eyebrow">Contact</span>
        <h2>Need a custom request or event order?</h2>
        <p>
          Reach out through Facebook, email, or mobile, then use the same system to keep confirmations and updates in
          one place.
        </p>
        <div className="contact-strip">
          <span>{settings.contactPhone}</span>
          <span>{settings.contactEmail}</span>
          <span>{settings.contactLocation}</span>
        </div>
        <div className="inline-actions">
          <Link className="button button--primary" to="/contact">
            Contact details
          </Link>
          <Link className="button button--ghost" to="/signup">
            Create account
          </Link>
        </div>
      </section>
    </motion.main>
  );
}

export default HomePage;
