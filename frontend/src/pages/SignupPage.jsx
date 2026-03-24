import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus2 } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, register, user } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate replace to={user?.role === 'admin' ? '/admin' : '/account'} />;
  }

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
      await register(form);
      navigate('/account', { replace: true });
    } catch (registerError) {
      setError(registerError.message);
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
          <span className="eyebrow">Create account</span>
          <h1>Register before you check out</h1>
          <p>Customer accounts keep orders tied to real users and make confirmations easier to manage later.</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="signupName">Full name</label>
            <input id="signupName" value={form.fullName} onChange={updateField('fullName')} />
          </div>

          <div className="field">
            <label htmlFor="signupEmail">Email</label>
            <input id="signupEmail" type="email" value={form.email} onChange={updateField('email')} />
          </div>

          <div className="field">
            <label htmlFor="signupPassword">Password</label>
            <input id="signupPassword" type="password" value={form.password} onChange={updateField('password')} />
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button--primary button--block" disabled={isSubmitting} type="submit">
            <UserPlus2 size={16} />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <div className="auth-card__note">
            <ShieldCheck size={16} />
            <span>This account will be used for checkout access and order confirmations.</span>
          </div>

          <p className="auth-card__switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </motion.main>
  );
}

export default SignupPage;
