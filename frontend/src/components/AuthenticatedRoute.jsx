import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function AuthenticatedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="page">
        <section className="empty-panel empty-panel--compact">
          <h2>Checking your account session...</h2>
          <p>Hold for a moment while your Print-IT account is verified.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children;
}

export default AuthenticatedRoute;
