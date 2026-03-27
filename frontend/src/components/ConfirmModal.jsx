import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

function ConfirmModal({ confirmLabel = 'Confirm', description, isLoading = false, isOpen, onClose, onConfirm, title }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="modal-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
          />

          <motion.section
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="modal modal--confirm"
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
          >
            <div className="confirm-modal__icon">
              <AlertTriangle size={20} />
            </div>

            <div className="confirm-modal__copy">
              <h2>{title}</h2>
              <p>{description}</p>
            </div>

            <div className="confirm-modal__actions">
              <button className="button button--ghost" disabled={isLoading} type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="button button--danger" disabled={isLoading} type="button" onClick={onConfirm}>
                {isLoading ? 'Working...' : confirmLabel}
              </button>
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default ConfirmModal;
