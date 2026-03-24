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
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  contact_number VARCHAR(25) NOT NULL,
  email VARCHAR(160),
  fulfillment_method VARCHAR(20) NOT NULL DEFAULT 'pickup' CHECK (fulfillment_method IN ('pickup', 'delivery')),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'completed')),
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

INSERT INTO products (name, price, description, image, category)
SELECT seed.name, seed.price, seed.description, seed.image, seed.category
FROM (
  VALUES
    (
      'Classic Hashbrown',
      45.00,
      'Crispy, golden hashbrown that is ideal for quick snacks, school breaks, and add-on orders.',
      '/product-media/hashbrown.svg',
      'Food'
    ),
    (
      'Creamy Pastillas Box',
      120.00,
      'Soft milk candy made for gifting, merienda trays, or sweet pairings with your print pickup.',
      '/product-media/pastillas.svg',
      'Food'
    ),
    (
      'Printing Services',
      8.00,
      'Flexible print service for documents, photos, reviewers, and custom print requests with instructions.',
      '/product-media/printing.svg',
      'Services'
    )
) AS seed(name, price, description, image, category)
WHERE NOT EXISTS (SELECT 1 FROM products);
