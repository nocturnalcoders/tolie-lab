---
title: Sorting with ORDER BY and limiting with LIMIT
---
"What's the cheapest thing you have?" Questions like this are answered by sorting the rows, then taking a few from the top.

## ORDER BY

`ORDER BY` sorts the result by a column, from small to large:

```sql
SELECT name, price FROM menu ORDER BY price;
```

Add `DESC` for the reverse order, from large to small. Its opposite, `ASC`, is the default, so it is rarely written:

```sql
SELECT name, price FROM menu ORDER BY price DESC;
```

Text columns are sorted alphabetically.

## When values are equal

Pulled Tea and Banana Fritters both cost 12000. Which one comes first? Without an extra rule, the database is free to choose. Give it a second column as a tie-breaker:

```sql
SELECT name, price FROM menu ORDER BY price, name;
```

| name | price |
|---|---|
| Sweet Iced Tea | 8000 |
| Black Coffee | 10000 |
| Banana Fritters | 12000 |
| Pulled Tea | 12000 |
| Milk Coffee | 15000 |
| Toast | 18000 |
| Fried Rice | 25000 |

Each column has its own direction: `ORDER BY price DESC, name` means price from the most expensive, and when prices are equal, name in alphabetical order.

## LIMIT

`LIMIT n` takes only the first `n` rows. Paired with `ORDER BY`, it is how you find "the most" of anything:

```sql
SELECT name, price FROM menu ORDER BY price, name LIMIT 2;
```

The result is the two cheapest items: Sweet Iced Tea and Black Coffee.

The writing order is: `SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT ...`. `LIMIT` always comes last, and `WHERE` (when there is one) filters before the rows are sorted.
