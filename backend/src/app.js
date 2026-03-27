const path = require('node:path');
const cors = require('cors');
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const paymentsRoutes = require('./routes/payments.routes');
const productsRoutes = require('./routes/products.routes');
const ordersRoutes = require('./routes/orders.routes');
const settingsRoutes = require('./routes/settings.routes');
const uploadsRoutes = require('./routes/uploads.routes');
const paymentsController = require('./controllers/payments.controller');
const { publicClientUrls, uploadsDir } = require('./config');
const { HttpError } = require('./utils/httpError');

const app = express();
const allowedOrigins = Array.from(
  new Set([
    ...publicClientUrls.flatMap((url) => [
      url,
      url.replace('localhost', '127.0.0.1'),
      url.replace('127.0.0.1', 'localhost'),
    ]),
  ]),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new HttpError(403, 'CORS origin is not allowed.'));
    },
  }),
);
app.post(
  '/api/payments/webhooks/paymongo',
  express.raw({ type: 'application/json' }),
  paymentsController.handlePaymongoWebhook,
);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(uploadsDir)));

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    message: 'Print-IT API is running.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/uploads', uploadsRoutes);

app.use((_request, _response, next) => {
  next(new HttpError(404, 'Endpoint not found.'));
});

app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  const message = status === 500 ? 'Internal server error.' : error.message;

  if (status === 500) {
    console.error(error);
  }

  response.status(status).json({
    error: message,
  });
});

module.exports = app;
