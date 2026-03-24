import { motion } from 'framer-motion';
import { BadgeCheck, HeartHandshake, Printer, Sandwich } from 'lucide-react';
import { Link } from 'react-router-dom';

const ABOUT_PANELS = [
  {
    icon: BadgeCheck,
    title: 'Our story',
    body: 'Print-IT combines affordable student-friendly printing with small-batch food orders in a single, cleaner storefront.',
  },
  {
    icon: Printer,
    title: 'What we offer',
    body: 'Customers can request print jobs with paper, color, side, and finish preferences while ordering snacks from the same menu.',
  },
  {
    icon: Sandwich,
    title: 'Why the menu matters',
    body: 'Food items help make the storefront feel approachable, while dynamic product management keeps the catalog ready for future additions.',
  },
  {
    icon: HeartHandshake,
    title: 'Why accounts matter',
    body: 'Customer signup and login make orders more trustworthy, reduce dummy submissions, and give customers a place to confirm past orders.',
  },
];

function AboutPage() {
  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="page-hero page-hero--centered">
        <span className="eyebrow">About Us</span>
        <h1>Print-IT is built to feel practical, local, and accountable.</h1>
        <p>
          The brand direction uses your shared references as layout inspiration, then shifts into its own print-first
          identity with darker neon visuals and a more technical feel.
        </p>
      </section>

      <section className="story-grid">
        {ABOUT_PANELS.map((panel) => (
          <article className="panel story-card" key={panel.title}>
            <div className="story-card__icon">
              <panel.icon size={20} />
            </div>
            <h2>{panel.title}</h2>
            <p>{panel.body}</p>
          </article>
        ))}
      </section>

      <section className="panel panel--cta">
        <span className="eyebrow">Ready to order</span>
        <h2>Sign in, browse the menu, and keep your orders tied to your account.</h2>
        <div className="inline-actions">
          <Link className="button button--primary" to="/signup">
            Create account
          </Link>
          <Link className="button button--ghost" to="/menu">
            Browse menu
          </Link>
        </div>
      </section>
    </motion.main>
  );
}

export default AboutPage;
