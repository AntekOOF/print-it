const assert = require('node:assert/strict');
const { afterEach, mock, test } = require('node:test');
const authController = require('../src/controllers/auth.controller');
const authService = require('../src/services/auth.service');

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

test('register returns an authenticated customer payload', async () => {
  const authResult = {
    token: 'sample-token',
    user: {
      id: 11,
      fullName: 'Print IT Customer',
      email: 'customer@example.com',
      role: 'customer',
    },
  };

  const registerMock = mock.method(authService, 'register', async () => authResult);
  const response = createResponse();
  const next = mock.fn();

  await authController.register(
    {
      body: {
        fullName: 'Print IT Customer',
        email: 'customer@example.com',
        password: 'Password123!',
      },
    },
    response,
    next,
  );

  assert.deepEqual(registerMock.mock.calls[0].arguments, [
    {
      fullName: 'Print IT Customer',
      email: 'customer@example.com',
      password: 'Password123!',
    },
  ]);
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body.data, authResult);
  assert.equal(next.mock.calls.length, 0);
});
