---
title: Multi-step reports with WITH
---
More and more of Ms. Rina's reports take several steps: work out the revenue per day first, then find the best day. A subquery can do it, but the statement soon gets hard to read. `WITH` gives a **name** to the result of a `SELECT`, and that name is then used like a table. Such a named result is called a **CTE**.

The `menu` and `orders` tables are the same as in the previous lesson: 12 orders from February to April 2024.

## One step, one name

```sql
WITH daily AS (
  SELECT o.order_date, SUM(m.price * o.quantity) AS revenue
  FROM orders o
  JOIN menu m ON m.id = o.menu_id
  GROUP BY o.order_date
)
SELECT order_date, revenue
FROM daily
WHERE revenue = (SELECT MAX(revenue) FROM daily);
```

The result is `2024-03-01|65000`, the day with the highest revenue. Read it from the top: `daily` is the revenue per day, then the main statement selects from `daily`. The name may be used more than once, here in `FROM` and inside the subquery.

A CTE is not a real table. It only exists while that one statement runs and is not stored in the database.

## Several steps

The next CTE is written after a comma, without repeating `WITH`, and may use the CTEs above it:

```sql
WITH daily AS (
  SELECT o.order_date, SUM(m.price * o.quantity) AS revenue
  FROM orders o
  JOIN menu m ON m.id = o.menu_id
  GROUP BY o.order_date
),
monthly AS (
  SELECT strftime('%Y-%m', order_date) AS month,
         COUNT(*) AS open_days,
         MAX(revenue) AS best_revenue
  FROM daily
  GROUP BY month
)
SELECT month, open_days, best_revenue
FROM monthly
ORDER BY month;
```

| month | open_days | best_revenue |
|---|---|---|
| 2024-02 | 2 | 48000 |
| 2024-03 | 5 | 65000 |
| 2024-04 | 2 | 60000 |

Every step can be checked on its own: replace the main statement with `SELECT * FROM daily` to see what it holds. That is how you build a long report without getting lost.
