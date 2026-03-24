ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  ADD COLUMN IF NOT EXISTS daily_limit INTEGER CHECK (daily_limit IS NULL OR daily_limit >= 0),
  ADD COLUMN IF NOT EXISTS service_config JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cash_on_pickup',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(40),
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(160),
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITHOUT TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('cash_on_pickup', 'gcash', 'manual_gcash'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('pending', 'awaiting_payment', 'paid', 'failed', 'expired', 'refunded'));
  END IF;
END $$;

UPDATE orders
SET tracking_token = md5(random()::text || clock_timestamp()::text || id::text)
WHERE tracking_token IS NULL;

ALTER TABLE orders
  ALTER COLUMN tracking_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_token_unique_idx ON orders(tracking_token);

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

UPDATE products
SET
  stock_quantity = CASE
    WHEN category = 'Food' AND stock_quantity IS NULL AND LOWER(name) LIKE '%hashbrown%' THEN 48
    WHEN category = 'Food' AND stock_quantity IS NULL AND LOWER(name) LIKE '%pastillas%' THEN 24
    ELSE stock_quantity
  END,
  daily_limit = CASE
    WHEN category = 'Food' AND daily_limit IS NULL AND LOWER(name) LIKE '%hashbrown%' THEN 60
    WHEN category = 'Food' AND daily_limit IS NULL AND LOWER(name) LIKE '%pastillas%' THEN 30
    ELSE daily_limit
  END,
  service_config = CASE
    WHEN category = 'Services' AND (service_config IS NULL OR service_config = '{}'::jsonb) THEN
      '{"printTypes":["Document","Photo","Reviewers","Custom Layout"],"paperSizes":["Short","A4","Legal"],"colorModes":["Black and White","Colored"],"printSides":["Single-sided","Double-sided"],"finishes":["Plain","Glossy","Matte","Laminated"]}'::jsonb
    ELSE COALESCE(service_config, '{}'::jsonb)
  END,
  updated_at = NOW();
