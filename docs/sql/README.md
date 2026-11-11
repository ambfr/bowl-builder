# Database

PostgreSQL on Supabase. The tables are created by Hibernate (`spring.jpa.hibernate.ddl-auto=update`), so there is no schema file to keep in sync. These scripts cover the parts Hibernate does not.

| File | Purpose |
|---|---|
| `setup.sql` | Enable row level security on every table (run once on a fresh database) |
| `admin.sql` | Promote an admin, reset a password, reset stock, wipe test data |
| `queries.sql` | Reporting queries: orders by status, revenue, popular ingredients, low stock |

## Tables

| Table | Holds | Notes |
|---|---|---|
| `ingredient` | name, category, price, nutrition, stock, `version` | `version` is the optimistic-lock column |
| `app_user` | email (unique), BCrypt hash, name, role | role is CUSTOMER, STAFF or ADMIN |
| `customer_order` | owner, status, size, promo code, totals, nutrition, created time | totals are a snapshot taken at order time |
| `order_item` | order, ingredient id, name, category, unit price | a snapshot, so later price changes never rewrite history |
| `favorite_bowl` | owner, name, base id, size | |
| `favorite_bowl_toppings`, `favorite_bowl_drizzles` | favorite id, ingredient id | one row per chosen ingredient |

## Row level security

Every table has RLS enabled with no policies. The Spring Boot API connects as the `postgres` role, which bypasses RLS, so it works normally. Supabase's auto-generated REST API uses a different role and gets nothing, so the data can only be reached through the app's own authenticated endpoints.