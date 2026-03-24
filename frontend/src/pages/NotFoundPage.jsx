import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <div className="empty-panel">
        <h1>Page not found</h1>
        <p>The route does not exist in this Print-IT build.</p>
        <Link className="button button--primary" to="/">
          Return home
        </Link>
      </div>
    </motion.main>
  );
}

export default NotFoundPage;
