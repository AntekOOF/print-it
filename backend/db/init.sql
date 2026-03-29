-- Canonical database setup now runs through db/migrations via scripts/initDb.js.
-- This file is kept as a final-schema reference snapshot for Print-IT.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('Food', 'Services')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  daily_limit INTEGER CHECK (daily_limit IS NULL OR daily_limit >= 0),
  service_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  tracking_token VARCHAR(64) NOT NULL UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  contact_number VARCHAR(25) NOT NULL,
  email VARCHAR(160),
  fulfillment_method VARCHAR(20) NOT NULL DEFAULT 'pickup' CHECK (fulfillment_method IN ('pickup', 'delivery')),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'completed')),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash_on_pickup' CHECK (payment_method IN ('cash_on_pickup', 'gcash', 'manual_gcash')),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'awaiting_payment', 'paid', 'failed', 'expired', 'refunded')),
  payment_provider VARCHAR(40),
  payment_reference VARCHAR(160),
  payment_proof_name VARCHAR(255),
  payment_proof_url TEXT,
  payment_proof_uploaded_at TIMESTAMP WITHOUT TIME ZONE,
  payment_url TEXT,
  paid_at TIMESTAMP WITHOUT TIME ZONE,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(120) NOT NULL,
  product_image TEXT,
  category VARCHAR(30) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  service_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(40) NOT NULL,
  event_id VARCHAR(120) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

INSERT INTO products (name, price, description, image, category, stock_quantity, daily_limit, service_config)
SELECT seed.name, seed.price, seed.description, seed.image, seed.category, seed.stock_quantity, seed.daily_limit, seed.service_config::jsonb
FROM (
  VALUES
    (
      'Classic Hashbrown',
      45.00,
      'Crispy, golden hashbrown that is ideal for quick snacks, school breaks, and add-on orders.',
      '/product-media/hashbrown.svg',
      'Food',
      48,
      60,
      '{}'::text
    ),
    (
      'Creamy Pastillas Box',
      120.00,
      'Soft milk candy made for gifting, merienda trays, or sweet pairings with your print pickup.',
      '/product-media/pastillas.svg',
      'Food',
      24,
      30,
      '{}'::text
    ),
    (
      'Printing Services',
      8.00,
      'Flexible print service for documents, photos, reviewers, and custom print requests with instructions.',
      '/product-media/printing.svg',
      'Services',
      NULL,
      NULL,
      '{"printTypes":["Document","Photo","Reviewers","Custom Layout"],"paperSizes":["Short","A4","Legal"],"colorModes":["Black and White","Colored"],"printSides":["Single-sided","Double-sided"],"finishes":["Plain","Glossy","Matte","Laminated"]}'::text
    )
) AS seed(name, price, description, image, category, stock_quantity, daily_limit, service_config)
WHERE NOT EXISTS (SELECT 1 FROM products);
