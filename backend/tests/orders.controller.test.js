const assert = require('node:assert/strict');
const { afterEach, mock, test } = require('node:test');
const ordersController = require('../src/controllers/orders.controller');
const ordersService = require('../src/services/orders.service');

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

test('createOrder returns the created order with tracking token', async () => {
  const createdOrder = {
    id: 7,
    orderNumber: 'PIT-20260323-ABC123',
    trackingToken: '0123456789abcdef0123456789abcdef',
    paymentMethod: 'cash_on_pickup',
    paymentStatus: 'pending',
  };

  mock.method(ordersService, 'createOrder', async () => createdOrder);

  const response = createResponse();
  const next = mock.fn();

  await ordersController.createOrder(
    {
      user: {
        sub: 5,
        email: 'customer@example.com',
        fullName: 'Sample Customer',
        role: 'customer',
      },
      body: {
        customerName: 'Sample Customer',
        contactNumber: '09171234567',
        email: 'customer@example.com',
        fulfillmentMethod: 'pickup',
        paymentMethod: 'cash_on_pickup',
        notes: 'Please prepare quickly',
        items: [
          {
            productId: 1,
            quantity: 2,
          },
        ],
      },
    },
    response,
    next,
  );

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body.data, createdOrder);
  assert.deepEqual(ordersService.createOrder.mock.calls[0].arguments[1], {
    sub: 5,
    email: 'customer@example.com',
    fullName: 'Sample Customer',
    role: 'customer',
  });
  assert.equal(next.mock.calls.length, 0);
});

test('trackOrder returns 404 when no matching order exists', async () => {
  mock.method(ordersService, 'trackOrder', async () => null);

  const response = createResponse();
  const next = mock.fn();

  await ordersController.trackOrder(
    {
      body: {
        orderNumber: 'PIT-20260323-ABC123',
        contactNumber: '09171234567',
      },
    },
    response,
    next,
  );

  assert.equal(next.mock.calls.length, 1);
  assert.equal(next.mock.calls[0].arguments[0].status, 404);
});

test('updatePaymentStatus returns the updated order payload', async () => {
  const updatedOrder = {
    id: 7,
    paymentStatus: 'paid',
  };

  const updateMock = mock.method(ordersService, 'updatePaymentStatus', async () => updatedOrder);
  const response = createResponse();
  const next = mock.fn();

  await ordersController.updatePaymentStatus(
    {
      params: {
        orderId: '7',
      },
      body: {
        paymentStatus: 'paid',
      },
    },
    response,
    next,
  );

  assert.deepEqual(updateMock.mock.calls[0].arguments, [7, 'paid']);
  assert.deepEqual(response.body.data, updatedOrder);
  assert.equal(next.mock.calls.length, 0);
});

test('listMyOrders returns orders for the authenticated customer', async () => {
  const myOrders = [
    {
      id: 9,
      orderNumber: 'PIT-20260324-CUST09',
    },
  ];

  const listMock = mock.method(ordersService, 'listOrdersByUser', async () => myOrders);
  const response = createResponse();
  const next = mock.fn();

  await ordersController.listMyOrders(
    {
      user: {
        sub: 12,
      },
    },
    response,
    next,
  );

  assert.deepEqual(listMock.mock.calls[0].arguments, [12]);
  assert.deepEqual(response.body.data, myOrders);
  assert.equal(next.mock.calls.length, 0);
});

test('uploadPaymentProof returns the updated order payload for the authenticated owner', async () => {
  const updatedOrder = {
    id: 9,
    orderNumber: 'PIT-20260329-PROOF01',
    paymentProofUrl: 'https://example.com/proof.png',
  };

  const uploadMock = mock.method(ordersService, 'uploadPaymentProof', async () => updatedOrder);
  const response = createResponse();
  const next = mock.fn();

  await ordersController.uploadPaymentProof(
    {
      params: {
        orderId: '9',
      },
      body: {
        paymentReference: 'GCASH-12345',
      },
      file: {
        originalname: 'proof.png',
      },
      user: {
        sub: 12,
        role: 'customer',
      },
    },
    response,
    next,
  );

  assert.deepEqual(uploadMock.mock.calls[0].arguments, [
    9,
    {
      paymentReference: 'GCASH-12345',
      file: {
        originalname: 'proof.png',
      },
    },
    {
      sub: 12,
      role: 'customer',
    },
  ]);
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body.data, updatedOrder);
  assert.equal(next.mock.calls.length, 0);
});
