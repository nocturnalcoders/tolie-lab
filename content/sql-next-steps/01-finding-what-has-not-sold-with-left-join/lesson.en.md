---
title: Finding what has not sold with LEFT JOIN
---
**SQL Basics** ended with a small note: Sweet Iced Tea does not appear in the sales report because nobody has ordered it yet. For Ms. Rina, the owner of **Senja Coffee Shop**, that is exactly what she wants to know: which items are not selling?

The tables are the same: `menu` (`id`, `name`, `category`, `price`) holds 7 items, and `orders` (`id`, `order_date`, `menu_id`, `quantity`) holds 8 orders from 4 and 5 March 2024.

## LEFT JOIN

A plain `JOIN` drops rows that have no partner. `LEFT JOIN` keeps **every row of the left table**, the table written after `FROM`. When there is no partner, the columns of the right table are filled with `NULL`:

```sql
SELECT m.name, o.order_date, o.quantity
FROM menu m
LEFT JOIN orders o ON o.menu_id = m.id
ORDER BY m.id, o.id;
```

| name | order_date | quantity |
|---|---|---|
| Black Coffee | 2024-03-05 | 4 |
| Milk Coffee | 2024-03-04 | 2 |
| Milk Coffee | 2024-03-04 | 1 |
| Milk Coffee | 2024-03-05 | 3 |
| Pulled Tea | 2024-03-04 | 3 |
| Sweet Iced Tea | NULL | NULL |

The three food items follow below. Sweet Iced Tea is now shown too, with empty order columns.

## Finding rows without a partner

A row without a partner is recognised by a right-table column that is `NULL`. A `NULL` is tested with `IS NULL`, not with `= NULL`:

```sql
SELECT m.name
FROM menu m
LEFT JOIN orders o ON o.menu_id = m.id
WHERE o.id IS NULL;
```

The result is one row: Sweet Iced Tea.

## COALESCE

For an item without orders, `SUM(o.quantity)` gives `NULL`, not 0. `COALESCE(a, b)` takes the first value that is not `NULL`, so it is the way to supply a fallback:

```sql
SELECT m.name, COALESCE(SUM(o.quantity), 0) AS sold
FROM menu m
LEFT JOIN orders o ON o.menu_id = m.id
GROUP BY m.id, m.name
ORDER BY m.id;
```

Sweet Iced Tea is shown with `sold` 0. Be careful when counting rows: `COUNT(*)` also counts that empty row, while `COUNT(o.id)` only counts values that are not `NULL`.
