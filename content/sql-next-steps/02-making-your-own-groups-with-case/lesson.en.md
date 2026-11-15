---
title: Making your own groups with CASE
---
Ms. Rina often asks about groups that are not in any table: which items count as cheap? How much revenue came from drinks compared with food each day? You can build a column like that yourself with `CASE`.

The `menu` and `orders` tables are the same as in the previous lesson.

## CASE WHEN

`CASE` tests its conditions one by one from the top, then uses the value of the **first** condition that is true. `ELSE` is used when none is true, and `END` closes it:

```sql
SELECT name, price,
  CASE
    WHEN price >= 20000 THEN 'large'
    WHEN price >= 12000 THEN 'medium'
    ELSE 'small'
  END AS size
FROM menu
ORDER BY id;
```

| name | price | size |
|---|---|---|
| Black Coffee | 10000 | small |
| Milk Coffee | 15000 | medium |
| Pulled Tea | 12000 | medium |
| Sweet Iced Tea | 8000 | small |
| Toast | 18000 | medium |
| Banana Fritters | 12000 | medium |
| Fried Rice | 25000 | large |

The order of the `WHEN` lines matters. Fried Rice also meets `price >= 12000`, but the condition above it was true first. Without `ELSE`, a row that matches no condition gets `NULL`.

## CASE inside SUM

`CASE` may sit inside an aggregate function. The idea: a matching row contributes its value, every other row contributes 0. That way one statement can work out several sums at once:

```sql
SELECT
  SUM(CASE WHEN m.category = 'drink' THEN o.quantity ELSE 0 END) AS drink_servings,
  SUM(CASE WHEN m.category = 'food' THEN o.quantity ELSE 0 END) AS food_servings
FROM orders o
JOIN menu m ON m.id = o.menu_id;
```

The result is a single row: `13|5`. Add `GROUP BY o.order_date` and you get one row per day, with the drink and food columns side by side.

The `ELSE 0` matters here. Without it, a day with no food orders would show `NULL` instead of 0.
