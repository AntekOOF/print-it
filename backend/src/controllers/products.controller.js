const productsService = require('../services/products.service');
const {
  normalizeCategory,
  validateProductId,
  validateProductPayload,
} = require('../utils/validation');

const listProducts = async (request, response, next) => {
  try {
    const category = request.query.category ? normalizeCategory(request.query.category) : undefined;
    const products = await productsService.listProducts(category, {
      includeInactive: false,
    });
    response.json({ data: products });
  } catch (error) {
    next(error);
  }
};

const listAdminProducts = async (request, response, next) => {
  try {
    const category = request.query.category ? normalizeCategory(request.query.category) : undefined;
    const products = await productsService.listProducts(category, {
      includeInactive: true,
    });
    response.json({ data: products });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (request, response, next) => {
  try {
    const product = validateProductPayload(request.body);
    const createdProduct = await productsService.createProduct(product);
    response.status(201).json({
      data: createdProduct,
      message: 'Product created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (request, response, next) => {
  try {
    const productId = validateProductId(request.params.productId);
    const product = validateProductPayload(request.body);
    const updatedProduct = await productsService.updateProduct(productId, product);
    response.json({
      data: updatedProduct,
      message: 'Product updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const updateProductActive = async (request, response, next) => {
  try {
    const productId = validateProductId(request.params.productId);
    const updatedProduct = await productsService.updateProductActive(productId, request.body?.isActive);
    response.json({
      data: updatedProduct,
      message: 'Product availability updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (request, response, next) => {
  try {
    const productId = validateProductId(request.params.productId);
    await productsService.deleteProduct(productId);
    response.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  deleteProduct,
  listAdminProducts,
  listProducts,
  updateProduct,
  updateProductActive,
};
