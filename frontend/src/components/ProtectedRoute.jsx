import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <main className="page">
        <section className="empty-panel empty-panel--compact">
          <h2>Checking admin session...</h2>
          <p>Hold for a moment while the dashboard access token is verified.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate replace state={{ from: location }} to="/admin/login" />;
  }

  return children;
}

export default ProtectedRoute;
