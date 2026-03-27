import { motion } from 'framer-motion';
import { Facebook, Mail, MapPin, Phone, TicketCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSiteSettings.js';

function ContactPage() {
  const { settings } = useSiteSettings();

  const cards = [
    {
      icon: Phone,
      label: 'Phone',
      value: settings.contactPhone,
      href: `tel:${settings.contactPhone}`,
    },
    {
      icon: Mail,
      label: 'Email',
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    {
      icon: Facebook,
      label: 'Facebook',
      value: settings.contactFacebook,
      href: settings.contactFacebook,
    },
    {
      icon: MapPin,
      label: 'Location',
      value: settings.contactLocation,
      href: null,
    },
  ];

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page page--public"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="page-hero page-hero--centered">
        <span className="eyebrow">Contact</span>
        <h1>Reach Print-IT through the channel that works best for you.</h1>
        <p>
          Use contact details for inquiries, event requests, or follow-ups, then keep actual orders inside the system
          so they remain trackable.
        </p>
      </section>

      <section className="contact-grid">
        {cards.map((card) => (
          <article className="panel contact-card" key={card.label}>
            <div className="story-card__icon">
              <card.icon size={18} />
            </div>
            <span className="eyebrow">{card.label}</span>
            {card.href ? (
              <a href={card.href} rel="noreferrer" target={card.href.startsWith('http') ? '_blank' : undefined}>
                {card.value}
              </a>
            ) : (
              <strong>{card.value}</strong>
            )}
          </article>
        ))}
      </section>

      <section className="section section--split">
        <div className="panel panel--highlight">
          <span className="eyebrow">Need a quick answer?</span>
          <h2>For custom jobs, mention the print type and deadline upfront.</h2>
          <p>
            That helps the team respond faster, especially for school events, org materials, or large print requests.
          </p>
        </div>

        <div className="panel panel--dark-callout">
          <span className="eyebrow">Already ordered?</span>
          <h2>Use order tracking before sending a follow-up message.</h2>
          <p>Your order page already shows the latest status, payment state, and confirmation details.</p>
          <Link className="button button--primary" to="/track-order">
            <TicketCheck size={16} />
            Track order
          </Link>
        </div>
      </section>
    </motion.main>
  );
}

export default ContactPage;
