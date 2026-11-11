-- Administration helpers. Replace the placeholders. Never commit real emails or passwords.

-- 1) Make an account an admin (register it on the site first, then sign out and in again).
UPDATE app_user SET role = 'ADMIN' WHERE email = 'YOUR_EMAIL_HERE';

-- Staff accounts can use the kitchen board but not the admin page:
-- UPDATE app_user SET role = 'STAFF' WHERE email = 'STAFF_EMAIL_HERE';

-- 2) Reset a forgotten password (BCrypt hash that Spring Security accepts).
--    Afterwards sign in and change it under Profile, then clear this query from your SQL history.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- UPDATE app_user
-- SET password_hash = extensions.crypt('TEMP_PASSWORD_HERE', extensions.gen_salt('bf', 10))
-- WHERE email = 'YOUR_EMAIL_HERE';

-- 3) Put every ingredient back to full stock.
-- UPDATE ingredient SET stock = 100;

-- 4) Wipe test data (children first). Runs in one transaction.
-- BEGIN;
--   DELETE FROM order_item;
--   DELETE FROM customer_order;
--   DELETE FROM favorite_bowl_toppings;
--   DELETE FROM favorite_bowl_drizzles;
--   DELETE FROM favorite_bowl;
--   DELETE FROM app_user;
--   UPDATE ingredient SET stock = 100;
-- COMMIT;