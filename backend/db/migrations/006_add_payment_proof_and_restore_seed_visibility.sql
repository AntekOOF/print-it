ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_proof_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMP WITHOUT TIME ZONE;

WITH seeded_products AS (
  SELECT id, is_active
  FROM products
  WHERE name IN ('Classic Hashbrown', 'Creamy Pastillas Box', 'Printing Services')
),
seeded_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE is_active = TRUE) AS active_count,
    COUNT(*) AS seeded_count
  FROM seeded_products
)
UPDATE products
SET
  is_active = TRUE,
  updated_at = NOW()
WHERE name IN ('Classic Hashbrown', 'Creamy Pastillas Box', 'Printing Services')
  AND EXISTS (
    SELECT 1
    FROM seeded_counts
    WHERE seeded_count = 3
      AND active_count <= 1
  );
