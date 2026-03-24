import { motion } from 'framer-motion';
import { SearchCheck, TicketCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackOrder } from '../lib/api.js';

function TrackOrderPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    orderNumber: '',
    contactNumber: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const order = await trackOrder(form);
      navigate(`/orders/${order.trackingToken}`);
    } catch (trackError) {
      setError(trackError.message);
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
          <span className="eyebrow">Public tracking</span>
          <h1>Find your order</h1>
          <p>Enter the order number and the same contact number used during checkout to open the public summary page.</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="orderNumber">Order number</label>
            <input id="orderNumber" placeholder="PIT-YYYYMMDD-XXXXXX" value={form.orderNumber} onChange={updateField('orderNumber')} />
          </div>

          <div className="field">
            <label htmlFor="trackContactNumber">Contact number</label>
            <input id="trackContactNumber" value={form.contactNumber} onChange={updateField('contactNumber')} />
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button--primary button--block" disabled={isSubmitting} type="submit">
            <SearchCheck size={16} />
            {isSubmitting ? 'Searching...' : 'Track order'}
          </button>

          <div className="auth-card__note">
            <TicketCheck size={16} />
            <span>Once found, the order page also shows payment status and any available GCash checkout link.</span>
          </div>
        </form>
      </section>
    </motion.main>
  );
}

export default TrackOrderPage;
