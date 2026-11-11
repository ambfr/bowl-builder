-- Run once on a fresh database, AFTER the app has started once
-- (Hibernate creates the tables on first start).
--
-- The Spring Boot app connects as the postgres role, which bypasses row level security,
-- so it keeps working. With RLS on and no policies, Supabase's public REST API
-- cannot read or write any of these tables.

ALTER TABLE ingredient             ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user               ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_bowl          ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_bowl_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_bowl_drizzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_order         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item             ENABLE ROW LEVEL SECURITY;

-- Check: every row should say rowsecurity = true
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Only needed if the ingredient table existed BEFORE @Version was added to the entity.
-- On a fresh database Hibernate creates this column itself.
-- ALTER TABLE ingredient ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;