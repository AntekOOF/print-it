# Print-IT

Print-IT is a full-stack ordering system for a small business that sells hashbrown, pastillas, and printing services. It includes a React storefront, an Express REST API, PostgreSQL-backed products and orders, a protected admin dashboard, public order tracking, file uploads, and optional GCash checkout through PayMongo.

## Stack

- Frontend: React + Vite + React Router + Framer Motion
- Backend: Node.js + Express
- Database: PostgreSQL
- Payments: PayMongo Checkout Sessions for GCash
- Manual transfer fallback: direct GCash number support

## Project Structure

```text
Print-IT/
|-- backend/
|   |-- db/
|   |   |-- init.sql
|   |   `-- migrations/
|   |-- scripts/
|   |   `-- initDb.js
|   |-- src/
|   |   |-- controllers/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- app.js
|   |   |-- config.js
|   |   `-- server.js
|   |-- tests/
|   `-- .env.example
|-- frontend/
|   |-- public/
|   |   `-- product-media/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   `-- .env.example
`-- README.md
```

## Main Features

### Customer side

- Dynamic product catalog from PostgreSQL
- Food and service category filtering
- Add to cart with quantity controls
- Printing service customization:
  file upload, print type, paper size, color mode, print side, finish, and special instructions
- Checkout with:
  cash on pickup, PayMongo GCash, or manual GCash transfer
- Public order summary page
- Public order tracking by order number and contact number
- Responsive dark UI with animations and skeleton loading states

### Admin side

- JWT-protected login
- Add, edit, hide/show, and delete products
- Upload product images through the configured media provider
- Manage food stock and daily limits
- Configure printing options for service products
- Filter orders by:
  search, order status, payment status, and date range
- Update order status
- Review manual GCash payment proof uploads
- View booked and paid summary cards

### Backend and database

- PostgreSQL tables:
  `users`, `products`, `orders`, `order_items`, `payment_webhook_events`
- Migration-based schema setup in `backend/db/migrations/`
- REST API for products, orders, uploads, auth, and payments
- Optional SMTP email notifications for order creation and status changes

## Setup

### 1. Create the PostgreSQL database

Create a database named `print_it`.

```sql
CREATE DATABASE print_it;
```

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env`.

Important variables:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/print_it
PUBLIC_SERVER_URL=http://localhost:5000
PUBLIC_CLIENT_URL=http://localhost:5173
PUBLIC_CLIENT_URLS=
JWT_SECRET=change-this-jwt-secret
ADMIN_EMAIL=admin@print-it.local
ADMIN_PASSWORD=replace-with-a-strong-password
MANUAL_GCASH_NUMBER=09771330538
MEDIA_STORAGE_PROVIDER=auto
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=print-it
PAYMONGO_SECRET_KEY=
PAYMONGO_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Print-IT <no-reply@print-it.local>
```

Notes:

- `npm run db:init` will run migrations and upsert the admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- `MANUAL_GCASH_NUMBER` enables the manual GCash transfer option shown in checkout and the public order page.
- `MEDIA_STORAGE_PROVIDER=auto` uses Cloudinary when its credentials are present, otherwise it falls back to local uploads.
- `CLOUDINARY_*` is recommended for production so product images, print files, and payment proofs survive redeploys.
- Leave `PAYMONGO_*` empty if you do not want GCash enabled yet.
- Leave `SMTP_*` empty if you do not want email notifications yet.
- Use `PUBLIC_CLIENT_URLS` for multiple allowed frontend origins in production, such as the Netlify site plus local development URLs.

### 3. Install backend dependencies and initialize the database

```bash
cd backend
npm install
npm run db:init
```

### 4. Start the backend API

```bash
cd backend
npm run dev
```

Backend base URL:

```text
http://localhost:5000
```

### 5. Configure the frontend

Copy `frontend/.env.example` to `frontend/.env`.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 6. Install frontend dependencies and run the app

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Production Deployment

Recommended production split:

- Frontend: Netlify
- Backend API: Render
- PostgreSQL: Render Postgres

### Netlify frontend

This repo already includes `frontend/netlify.toml`.

Set this environment variable in Netlify:

```env
VITE_API_BASE_URL=https://your-backend-host/api
```

Deploy settings:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

### Render backend

This repo includes a Render Blueprint file at `render.yaml`.

It is configured to:

- create a Node web service named `print-it-api`
- create a PostgreSQL database named `print-it-db`
- run `npm run db:init && npm start` on boot so migrations and the seeded admin account stay in sync

Set these values before the first live deploy:

```env
PUBLIC_SERVER_URL=https://your-render-service.onrender.com
ADMIN_PASSWORD=replace-with-a-strong-password
PAYMONGO_SECRET_KEY=
PAYMONGO_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

Recommended CORS/client values:

```env
PUBLIC_CLIENT_URL=https://your-netlify-site.netlify.app
PUBLIC_CLIENT_URLS=https://your-netlify-site.netlify.app,http://localhost:5173,http://127.0.0.1:5173
```

Important note about uploads:

- the app now supports Cloudinary for product images, print files, and manual GCash proof uploads
- if Cloudinary credentials are not configured, uploads fall back to the backend filesystem
- free hosting plans often use ephemeral local storage, so Cloudinary is the recommended production setup

## GCash Setup

GCash is wired through PayMongo Checkout Sessions.

To enable it:

1. Add your PayMongo secret key to `PAYMONGO_SECRET_KEY`.
2. Expose your backend publicly in development, for example through a tunnel.
3. Register a PayMongo webhook that points to:

```text
POST /api/payments/webhooks/paymongo
```

4. Set `PAYMONGO_WEBHOOK_SECRET` from the webhook signing secret shown by PayMongo.

Without PayMongo credentials:

- the storefront still works
- cash on pickup still works
- PayMongo GCash is shown as unavailable in checkout

## Manual GCash Fallback

If `MANUAL_GCASH_NUMBER` is set, checkout also offers a manual transfer option.

Flow:

1. Customer selects `Manual GCash transfer`.
2. Customer sees the recipient number in checkout and again on the public order page.
3. Customer can add an optional sender name or transfer reference when placing the order.
4. The order is created with `payment_status = awaiting_payment`.
5. Customer can upload a screenshot or PDF payment proof from the order confirmation page.
6. Admin reviews the proof and updates the payment status to `paid` from the dashboard.

## API Overview

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Products

- `GET /api/products`
- `GET /api/products/admin/all`
- `POST /api/products`
- `PUT /api/products/:productId`
- `PATCH /api/products/:productId/active`
- `DELETE /api/products/:productId`

### Orders

- `POST /api/orders`
- `POST /api/orders/track`
- `GET /api/orders/public/:trackingToken`
- `GET /api/orders/admin/summary`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders/:orderId/payment-proof`
- `PATCH /api/orders/:orderId/status`
- `PATCH /api/orders/:orderId/payment-status`

### Uploads

- `POST /api/uploads/product-image`
- `POST /api/uploads/print-file`

### Payments

- `GET /api/payments/config`
- `POST /api/payments/orders/:trackingToken/checkout`
- `POST /api/payments/webhooks/paymongo`

## Testing and Verification

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Seeded Admin Account

The seeded admin account comes from your backend environment:

- email: value of `ADMIN_EMAIL`
- password: value of `ADMIN_PASSWORD`

With the example values:

- email: `admin@print-it.local`
- password: the value you set in `ADMIN_PASSWORD`
