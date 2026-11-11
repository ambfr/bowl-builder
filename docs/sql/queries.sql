-- Reporting queries. All read-only.

-- Orders by status
SELECT status, count(*) AS orders
FROM customer_order
GROUP BY status
ORDER BY orders DESC;

-- Revenue per day (cancelled orders excluded)
SELECT date_trunc('day', created_at) AS day,
       count(*)                      AS orders,
       sum(total)                    AS revenue
FROM customer_order
WHERE status <> 'CANCELLED'
GROUP BY 1
ORDER BY 1 DESC;

-- Most popular ingredients (cancelled orders excluded)
SELECT oi.name, oi.category, count(*) AS times_ordered
FROM order_item oi
JOIN customer_order o ON o.id = oi.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY oi.name, oi.category
ORDER BY times_ordered DESC;

-- Most popular bowls by size
SELECT bowl_size, count(*) AS orders, round(avg(total), 2) AS avg_total
FROM customer_order
WHERE status <> 'CANCELLED'
GROUP BY bowl_size
ORDER BY orders DESC;

-- How often each promo code is used
SELECT promo_code, count(*) AS uses
FROM customer_order
WHERE promo_code IS NOT NULL
GROUP BY promo_code
ORDER BY uses DESC;

-- Ingredients that are low or out of stock
SELECT name, category, stock
FROM ingredient
WHERE stock < 10
ORDER BY stock, name;

-- Top customers by spend
SELECT u.email, count(o.id) AS orders, sum(o.total) AS spent
FROM app_user u
JOIN customer_order o ON o.user_id = u.id
WHERE o.status <> 'CANCELLED'
GROUP BY u.email
ORDER BY spent DESC
LIMIT 10;