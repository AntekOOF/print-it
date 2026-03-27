CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id_created_at
  ON order_events (order_id, created_at, id);

INSERT INTO order_events (order_id, event_type, title, description, created_at)
SELECT
  orders.id,
  'order_imported',
  CASE orders.status
    WHEN 'completed' THEN 'Order completed'
    WHEN 'ready' THEN 'Order ready for pickup'
    WHEN 'preparing' THEN 'Order is being prepared'
    WHEN 'cancelled' THEN 'Order cancelled'
    ELSE 'Order submitted'
  END,
  CASE
    WHEN orders.payment_status = 'paid' THEN 'Imported existing order with confirmed payment.'
    WHEN orders.payment_status = 'awaiting_payment' THEN 'Imported existing order that is still awaiting payment.'
    ELSE 'Imported existing order timeline entry.'
  END,
  orders.created_at
FROM orders
WHERE NOT EXISTS (
  SELECT 1
  FROM order_events
  WHERE order_events.order_id = orders.id
);
