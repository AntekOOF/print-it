import { AnimatePresence, motion } from 'framer-motion';
import { LoaderCircle, Paperclip, Printer, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../hooks/useCart.js';
import { uploadPrintFile } from '../lib/api.js';
import { formatCurrency } from '../lib/formatters.js';
import { resolveMediaUrl } from '../lib/media.js';
import QuantitySelector from './QuantitySelector.jsx';

const buildServiceDefaults = (product) => {
  const config = product?.serviceConfig || {};

  return {
    printType: config.printTypes?.[0] || '',
    paperSize: config.paperSizes?.[0] || '',
    colorMode: config.colorModes?.[0] || '',
    printSide: config.printSides?.[0] || '',
    finish: config.finishes?.[0] || '',
    specialInstructions: '',
    fileName: '',
    fileUrl: '',
  };
};

function ProductModalContent({ initialQuantity = 1, onAdded, onClose, product }) {
  const { addItem } = useCart();
  const isService = product.category === 'Services';
  const [quantity, setQuantity] = useState(Math.max(1, initialQuantity));
  const [serviceDetails, setServiceDetails] = useState(buildServiceDefaults(product));
  const [error, setError] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const maxQuantity =
    product.category === 'Food' && product.stockQuantity !== null && product.stockQuantity !== undefined
      ? Math.max(1, product.stockQuantity)
      : 999;

  const updateServiceField = (field) => (event) => {
    const value = event.target.value;
    setServiceDetails((currentDetails) => ({
      ...currentDetails,
      [field]: value,
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUploadingFile(true);
      setError('');

      const uploadedFile = await uploadPrintFile(file);

      setServiceDetails((currentDetails) => ({
        ...currentDetails,
        fileName: uploadedFile.originalName,
        fileUrl: uploadedFile.url,
      }));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddToCart = () => {
    if (isService && !serviceDetails.printType) {
      setError('Select a print type before adding this service.');
      return;
    }

    addItem(product, quantity, serviceDetails);
    onClose();
    onAdded?.();
  };

  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        className="modal-backdrop"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="modal"
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
      >
        <div className="modal__header">
          <div>
            <span className="eyebrow">{product.category}</span>
            <h2>{product.name}</h2>
          </div>

          <button aria-label="Close modal" className="icon-button" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal__content">
          <div className="modal__media">
            <img alt={product.name} src={resolveMediaUrl(product.image)} />
          </div>

          <div className="modal__details">
            <p>{product.description}</p>

            <div className="panel panel--soft">
              <div className="panel__row">
                <span>Price</span>
                <strong>{formatCurrency(product.price)}</strong>
              </div>

              <div className="panel__row">
                <span>Quantity</span>
                <QuantitySelector max={maxQuantity} value={quantity} onChange={setQuantity} />
              </div>
            </div>

            {isService ? (
              <div className="service-form">
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="printType">Print type</label>
                    <select id="printType" value={serviceDetails.printType} onChange={updateServiceField('printType')}>
                      {(product.serviceConfig?.printTypes || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="paperSize">Paper size</label>
                    <select id="paperSize" value={serviceDetails.paperSize} onChange={updateServiceField('paperSize')}>
                      {(product.serviceConfig?.paperSizes || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="colorMode">Color mode</label>
                    <select id="colorMode" value={serviceDetails.colorMode} onChange={updateServiceField('colorMode')}>
                      {(product.serviceConfig?.colorModes || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="printSide">Print side</label>
                    <select id="printSide" value={serviceDetails.printSide} onChange={updateServiceField('printSide')}>
                      {(product.serviceConfig?.printSides || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="finish">Finish</label>
                    <select id="finish" value={serviceDetails.finish} onChange={updateServiceField('finish')}>
                      {(product.serviceConfig?.finishes || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="fileUpload">File upload</label>
                    <label className="upload-field" htmlFor="fileUpload">
                      {isUploadingFile ? <LoaderCircle className="spin" size={16} /> : <Paperclip size={16} />}
                      <span>{serviceDetails.fileName || 'Attach the print file'}</span>
                      <small>
                        {isUploadingFile ? 'Uploading to the server...' : 'PDF, DOCX, XLSX, TXT, JPG, PNG, or WEBP'}
                      </small>
                    </label>
                    <input id="fileUpload" type="file" onChange={handleFileUpload} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="instructions">Special instructions</label>
                  <textarea
                    id="instructions"
                    placeholder="Paper size notes, layout instructions, finish requests, or delivery notes"
                    rows="4"
                    value={serviceDetails.specialInstructions}
                    onChange={updateServiceField('specialInstructions')}
                  />
                </div>
              </div>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}

            <button
              className="button button--primary button--block"
              disabled={isUploadingFile}
              type="button"
              onClick={handleAddToCart}
            >
              {isService ? <Printer size={16} /> : <ShoppingBag size={16} />}
              Add to cart
            </button>
          </div>
        </div>
      </motion.section>
    </>
  );
}

function ProductModal({ initialQuantity = 1, isOpen, onAdded, onClose, product }) {
  return (
    <AnimatePresence>
      {isOpen && product ? (
        <ProductModalContent
          key={`${product.id}-${initialQuantity}`}
          initialQuantity={initialQuantity}
          onAdded={onAdded}
          onClose={onClose}
          product={product}
        />
      ) : null}
    </AnimatePresence>
  );
}

export default ProductModal;
