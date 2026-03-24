DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_payment_method_check;
  END IF;

  ALTER TABLE orders
    ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('cash_on_pickup', 'gcash', 'manual_gcash'));
END $$;
