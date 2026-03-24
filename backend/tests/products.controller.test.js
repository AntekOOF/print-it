const assert = require('node:assert/strict');
const { afterEach, mock, test } = require('node:test');
const productsController = require('../src/controllers/products.controller');
const productsService = require('../src/services/products.service');

const createResponse = () => ({
  body: null,
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

afterEach(() => {
  mock.restoreAll();
});

test('createProduct returns a created product payload', async () => {
  const createdProduct = {
    id: 10,
    name: 'Custom Print Bundle',
    price: 15,
    description: 'Service product',
    image: '/uploads/products/custom-print.png',
    category: 'Services',
    isActive: true,
    stockQuantity: null,
    dailyLimit: null,
    serviceConfig: {
      printTypes: ['Document'],
      paperSizes: ['A4'],
      colorModes: ['Colored'],
      printSides: ['Single-sided'],
      finishes: ['Glossy'],
    },
  };

  mock.method(productsService, 'createProduct', async () => createdProduct);

  const response = createResponse();
  const next = mock.fn();

  await productsController.createProduct(
    {
      body: {
        name: 'Custom Print Bundle',
        price: 15,
        description: 'Service product',
        image: '/uploads/products/custom-print.png',
        category: 'Services',
        serviceConfig: {
          printTypes: ['Document'],
          paperSizes: ['A4'],
          colorModes: ['Colored'],
          printSides: ['Single-sided'],
          finishes: ['Glossy'],
        },
      },
    },
    response,
    next,
  );

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body.data, createdProduct);
  assert.equal(next.mock.calls.length, 0);
});

test('updateProductActive forwards the requested active state', async () => {
  const updatedProduct = {
    id: 3,
    isActive: false,
  };

  const updateMock = mock.method(productsService, 'updateProductActive', async () => updatedProduct);
  const response = createResponse();
  const next = mock.fn();

  await productsController.updateProductActive(
    {
      params: {
        productId: '3',
      },
      body: {
        isActive: false,
      },
    },
    response,
    next,
  );

  assert.deepEqual(response.body.data, updatedProduct);
  assert.deepEqual(updateMock.mock.calls[0].arguments, [3, false]);
  assert.equal(next.mock.calls.length, 0);
});
