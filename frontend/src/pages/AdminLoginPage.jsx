import { motion } from 'framer-motion';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function AdminLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate replace to="/admin" />;
  }

  const redirectTo = location.state?.from?.pathname || '/admin';

  const updateField = (field) => (event) =>
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError('');
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="page auth-page"
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 16 }}
    >
      <section className="auth-card panel">
        <div className="auth-card__hero">
          <span className="eyebrow">Protected admin</span>
          <h1>Sign in to manage Print-IT</h1>
          <p>Use the seeded admin account or your updated admin credentials from the backend environment.</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="adminEmail">Email</label>
            <input id="adminEmail" type="email" value={form.email} onChange={updateField('email')} />
          </div>

          <div className="field">
            <label htmlFor="adminPassword">Password</label>
            <input id="adminPassword" type="password" value={form.password} onChange={updateField('password')} />
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button--primary button--block" disabled={isSubmitting} type="submit">
            <LockKeyhole size={16} />
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="auth-card__note">
            <ShieldCheck size={16} />
            <span>Admin CRUD, order visibility, and status updates are now restricted behind JWT auth.</span>
          </div>
        </form>
      </section>
    </motion.main>
  );
}

export default AdminLoginPage;
