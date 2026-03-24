import { motion } from 'framer-motion';
import { Camera, Cookie, Printer, School } from 'lucide-react';
import BrandArtwork from '../components/BrandArtwork.jsx';

const GALLERY_ITEMS = [
  {
    icon: School,
    title: 'Campus pop-up tables',
    description: 'Show the in-person side of the project with moments from events, student areas, and quick pickup setups.',
    accent: 'gallery-card--crowd',
  },
  {
    icon: Cookie,
    title: 'Snack drops and bundles',
    description: 'Highlight the food lineup with trays, bundles, and close-up shots that make the menu feel real.',
    accent: 'gallery-card--snacks',
  },
  {
    icon: Printer,
    title: 'Print jobs in progress',
    description: 'Use the gallery to show document stacks, custom layouts, review packs, or school printing requests.',
    accent: 'gallery-card--prints',
  },
  {
    icon: Camera,
    title: 'Behind the brand',
    description: 'Capture team moments, order preparation, or booth setups so the site feels local and trustworthy.',
    accent: 'gallery-card--brand',
  },
];

function GalleryPage() {
  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="page-hero page-hero--centered">
        <span className="eyebrow">Gallery</span>
        <h1>Moments, products, and print work that give Print-IT a real-world face.</h1>
        <p>
          This page is designed to hold your actual booth, customer, and product photos later. For now, it uses a
          branded layout inspired by the references you shared without copying them directly.
        </p>
      </section>

      <section className="gallery-grid">
        <div className="gallery-grid__feature panel">
          <BrandArtwork compact />
        </div>

        {GALLERY_ITEMS.map((item) => (
          <article className={`gallery-card ${item.accent}`} key={item.title}>
            <div className="gallery-card__visual">
              <item.icon size={28} />
            </div>
            <div className="gallery-card__body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </section>
    </motion.main>
  );
}

export default GalleryPage;
