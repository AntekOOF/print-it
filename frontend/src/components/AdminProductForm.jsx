import { ImagePlus, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { uploadProductImage } from '../lib/api.js';
import { resolveMediaUrl } from '../lib/media.js';

const buildInitialValues = (product) => ({
  name: product?.name || '',
  price: product?.price ? String(product.price) : '',
  description: product?.description || '',
  image: product?.image || '',
  category: product?.category || 'Food',
  isActive: product?.isActive ?? true,
  stockQuantity:
    product?.stockQuantity === null || product?.stockQuantity === undefined ? '' : String(product.stockQuantity),
  dailyLimit: product?.dailyLimit === null || product?.dailyLimit === undefined ? '' : String(product.dailyLimit),
  serviceConfig: {
    printTypes: product?.serviceConfig?.printTypes?.join(', ') || 'Document, Photo, Reviewers, Custom Layout',
    paperSizes: product?.serviceConfig?.paperSizes?.join(', ') || 'Short, A4, Legal',
    colorModes: product?.serviceConfig?.colorModes?.join(', ') || 'Black and White, Colored',
    printSides: product?.serviceConfig?.printSides?.join(', ') || 'Single-sided, Double-sided',
    finishes: product?.serviceConfig?.finishes?.join(', ') || 'Plain, Glossy, Matte, Laminated',
  },
});

function AdminProductForm({ isSaving, onCancel, onSubmit, product, token }) {
  const [values, setValues] = useState(buildInitialValues(product));
  const [error, setError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const updateField = (field) => (event) => {
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValues((currentValues) => ({
      ...currentValues,
      [field]: nextValue,
    }));
  };

  const updateServiceConfigField = (field) => (event) =>
    setValues((currentValues) => ({
      ...currentValues,
      serviceConfig: {
        ...currentValues.serviceConfig,
        [field]: event.target.value,
      },
    }));

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      setError('');

      const uploadedFile = await uploadProductImage(token, file);
      setValues((currentValues) => ({
        ...currentValues,
        image: uploadedFile.relativePath,
      }));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const parsedPrice = Number(values.price);

    if (!values.name.trim() || !values.description.trim() || !values.image.trim()) {
      setError('Name, description, and image are required.');
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    setError('');
    onSubmit({
      ...values,
      price: parsedPrice,
      stockQuantity: values.stockQuantity === '' ? null : Number(values.stockQuantity),
      dailyLimit: values.dailyLimit === '' ? null : Number(values.dailyLimit),
    });
  };

  return (
    <form className="panel admin-form" onSubmit={handleSubmit}>
      <div className="panel__header">
        <div>
          <span className="eyebrow">{product ? 'Edit product' : 'Add product'}</span>
          <h2>{product ? 'Update product details' : 'Create a new product'}</h2>
        </div>
      </div>

      <div className="field">
        <label htmlFor="productName">Name</label>
        <input id="productName" value={values.name} onChange={updateField('name')} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="productPrice">Price</label>
          <input
            id="productPrice"
            min="0"
            step="0.01"
            type="number"
            value={values.price}
            onChange={updateField('price')}
          />
        </div>

        <div className="field">
          <label htmlFor="productCategory">Category</label>
          <select id="productCategory" value={values.category} onChange={updateField('category')}>
            <option value="Food">Food</option>
            <option value="Services">Services</option>
          </select>
        </div>
      </div>

      <label className="toggle-field">
        <input checked={values.isActive} type="checkbox" onChange={updateField('isActive')} />
        <span>Visible in storefront</span>
      </label>

      <div className="field">
        <label htmlFor="productImage">Image URL or uploaded path</label>
        <input
          id="productImage"
          placeholder="/product-media/example.svg"
          value={values.image}
          onChange={updateField('image')}
        />
      </div>

      <div className="field">
        <label htmlFor="productImageUpload">Upload image</label>
        <label className="upload-field" htmlFor="productImageUpload">
          {isUploadingImage ? <LoaderCircle className="spin" size={16} /> : <ImagePlus size={16} />}
          <span>{isUploadingImage ? 'Uploading product image...' : 'Select JPG, PNG, WEBP, GIF, or SVG'}</span>
          <small>Uploaded images are stored on the backend and can be reused later.</small>
        </label>
        <input id="productImageUpload" type="file" onChange={handleImageUpload} />
      </div>

      {values.image ? (
        <div className="admin-image-preview">
          <img alt="Product preview" src={resolveMediaUrl(values.image)} />
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="productDescription">Description</label>
        <textarea
          id="productDescription"
          rows="5"
          value={values.description}
          onChange={updateField('description')}
        />
      </div>

      {values.category === 'Food' ? (
        <div className="form-grid">
          <div className="field">
            <label htmlFor="stockQuantity">Stock quantity</label>
            <input
              id="stockQuantity"
              min="0"
              type="number"
              value={values.stockQuantity}
              onChange={updateField('stockQuantity')}
            />
          </div>

          <div className="field">
            <label htmlFor="dailyLimit">Daily limit</label>
            <input
              id="dailyLimit"
              min="0"
              type="number"
              value={values.dailyLimit}
              onChange={updateField('dailyLimit')}
            />
          </div>
        </div>
      ) : (
        <div className="service-settings">
          <div className="field">
            <label htmlFor="printTypes">Print types</label>
            <input id="printTypes" value={values.serviceConfig.printTypes} onChange={updateServiceConfigField('printTypes')} />
          </div>

          <div className="field">
            <label htmlFor="paperSizes">Paper sizes</label>
            <input id="paperSizes" value={values.serviceConfig.paperSizes} onChange={updateServiceConfigField('paperSizes')} />
          </div>

          <div className="field">
            <label htmlFor="colorModes">Color modes</label>
            <input id="colorModes" value={values.serviceConfig.colorModes} onChange={updateServiceConfigField('colorModes')} />
          </div>

          <div className="field">
            <label htmlFor="printSides">Print sides</label>
            <input id="printSides" value={values.serviceConfig.printSides} onChange={updateServiceConfigField('printSides')} />
          </div>

          <div className="field">
            <label htmlFor="finishes">Finish options</label>
            <input id="finishes" value={values.serviceConfig.finishes} onChange={updateServiceConfigField('finishes')} />
          </div>
        </div>
      )}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-form__actions">
        <button className="button button--primary" disabled={isSaving || isUploadingImage} type="submit">
          {isSaving ? 'Saving...' : product ? 'Save changes' : 'Add product'}
        </button>

        {product ? (
          <button className="button button--ghost" type="button" onClick={onCancel}>
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default AdminProductForm;
