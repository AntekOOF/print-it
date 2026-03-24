import { motion } from 'framer-motion';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate replace to={user?.role === 'admin' ? '/admin' : '/account'} />;
  }

  const redirectTo = location.state?.from?.pathname || '/account';

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
      const signedInUser = await login(form);
      navigate(signedInUser.role === 'admin' ? '/admin' : redirectTo, { replace: true });
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
          <span className="eyebrow">Customer account</span>
          <h1>Sign in before placing an order</h1>
          <p>Account-based checkout helps confirm real customers and keeps your order history in one place.</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="customerEmail">Email</label>
            <input id="customerEmail" type="email" value={form.email} onChange={updateField('email')} />
          </div>

          <div className="field">
            <label htmlFor="customerPassword">Password</label>
            <input id="customerPassword" type="password" value={form.password} onChange={updateField('password')} />
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button--primary button--block" disabled={isSubmitting} type="submit">
            <LockKeyhole size={16} />
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="auth-card__note">
            <ShieldCheck size={16} />
            <span>Your customer account is used for order confirmation, tracking, and checkout access.</span>
          </div>

          <p className="auth-card__switch">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </section>
    </motion.main>
  );
}

export default LoginPage;
