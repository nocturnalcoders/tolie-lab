---
title: Ranking the best sellers with window functions
---
In this last lesson you build the best-seller report, complete with a rank. The new tool is the **window function**.

`GROUP BY` sums many rows up into one. A window function also calculates over many rows, but **every row is still shown** and gets its own result. You recognise one by the word `OVER` after the function name.

The `menu` and `orders` tables are the same as in the last two lessons.

## A running total

`SUM(...) OVER (ORDER BY ...)` adds up from the first row to the current one, in the order given inside `OVER`:

```sql
WITH monthly AS (
  SELECT strftime('%Y-%m', o.order_date) AS month,
         SUM(m.price * o.quantity) AS revenue
  FROM orders o
  JOIN menu m ON m.id = o.menu_id
  GROUP BY month
)
SELECT month, revenue, SUM(revenue) OVER (ORDER BY month) AS running
FROM monthly
ORDER BY month;
```

| month | revenue | running |
|---|---|---|
| 2024-02 | 84000 | 84000 |
| 2024-03 | 222000 | 306000 |
| 2024-04 | 85000 | 391000 |

The `running` column shows the revenue from the start up to that month.

## RANK

`RANK() OVER (ORDER BY ...)` hands out rank numbers in the order given inside `OVER`:

```sql
WITH per_item AS (
  SELECT m.name, SUM(o.quantity) AS sold
  FROM orders o
  JOIN menu m ON m.id = o.menu_id
  GROUP BY m.id, m.name
)
SELECT RANK() OVER (ORDER BY sold DESC) AS position, name, sold
FROM per_item
ORDER BY position, name;
```

| position | name | sold |
|---|---|---|
| 1 | Milk Coffee | 8 |
| 2 | Black Coffee | 7 |
| 3 | Banana Fritters | 3 |
| 3 | Fried Rice | 3 |
| 3 | Pulled Tea | 3 |
| 3 | Toast | 3 |

Equal values get the same rank, and the next numbers are skipped: after four items at rank 3, the next item would be ranked 7.

The `ORDER BY` inside `OVER` only controls how the value is worked out. The order of the result rows is still set by the `ORDER BY` at the end of the statement, so do not forget to write it.
