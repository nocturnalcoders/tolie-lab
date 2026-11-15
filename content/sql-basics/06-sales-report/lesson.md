---
title: Combining tables with JOIN
---
In the last lesson we put everything together into the sales report Ms. Rina really uses.

Writing the item name and price on every transaction is wasteful and invites typos. Tidy records only store the **menu number**. The `orders` table holds `menu_id`, which is the `id` from the `menu` table:

| id | order_date | menu_id | quantity |
|---|---|---|---|
| 1 | 2024-03-04 | 2 | 2 |
| 2 | 2024-03-04 | 5 | 1 |
| 3 | 2024-03-04 | 3 | 3 |
| 4 | 2024-03-04 | 2 | 1 |
| 5 | 2024-03-05 | 7 | 2 |
| 6 | 2024-03-05 | 1 | 4 |
| 7 | 2024-03-05 | 2 | 3 |
| 8 | 2024-03-05 | 6 | 2 |

Order number 1 is 2 servings of menu item number 2. Which item is that, and what does it cost? The answer is in the `menu` table (`id`, `name`, `category`, `price`), which still holds the same rows as in lesson 1.

## JOIN

`JOIN` puts rows from two tables side by side, and `ON` says which rows belong together:

```sql
SELECT orders.order_date, menu.name, orders.quantity
FROM orders
JOIN menu ON menu.id = orders.menu_id
ORDER BY orders.id;
```

The first row is `2024-03-04|Milk Coffee|2`. Both tables have an `id` column, so write `table.column` to make clear which one you mean.

## Short names for tables

To keep things short, give a table a short name right after its name:

```sql
SELECT o.order_date, m.name, o.quantity
FROM orders o
JOIN menu m ON m.id = o.menu_id
ORDER BY o.id;
```

## JOIN together with GROUP BY

The result of a `JOIN` can be filtered, calculated and grouped like any table. Revenue per day:

```sql
SELECT o.order_date, SUM(m.price * o.quantity) AS revenue
FROM orders o
JOIN menu m ON m.id = o.menu_id
GROUP BY o.order_date
ORDER BY o.order_date;
```

| order_date | revenue |
|---|---|
| 2024-03-04 | 99000 |
| 2024-03-05 | 159000 |

One more thing: `JOIN` only shows rows that have a partner. Sweet Iced Tea has never been ordered, so it does not appear in any of the results above.
