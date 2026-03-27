CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name VARCHAR(160) NOT NULL DEFAULT 'Print-IT',
  hero_headline VARCHAR(220) NOT NULL DEFAULT 'Affordable Printing & Student Products',
  hero_subtext VARCHAR(260) NOT NULL DEFAULT 'From snacks to prints, we got you covered!',
  about_summary TEXT NOT NULL DEFAULT 'Print-IT is a student-led business that combines affordable printing services with easy snack ordering for busy school communities.',
  contact_email VARCHAR(160) NOT NULL DEFAULT 'printitfundit@gmail.com',
  contact_phone VARCHAR(40) NOT NULL DEFAULT '+63 977 133 0538',
  contact_facebook TEXT NOT NULL DEFAULT 'https://facebook.com/PrintIT',
  contact_location VARCHAR(200) NOT NULL DEFAULT 'Philippines'
);

INSERT INTO site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

UPDATE orders
SET status = 'preparing'
WHERE status = 'processing';

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'));
