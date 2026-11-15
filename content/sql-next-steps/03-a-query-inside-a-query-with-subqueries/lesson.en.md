---
title: A query inside a query with subqueries
---
"Which items cost more than the average?" This question from Ms. Rina takes two steps: work out the average first, then compare every item with that number. It is natural to try `WHERE price > AVG(price)`, but that fails: `WHERE` tests rows one at a time and may not hold an aggregate function.

The way out is a **subquery**: a `SELECT` inside brackets, inside another statement. The database works out the part in brackets first.

## A subquery that gives one value

A subquery whose result is one row and one column may be used wherever a number can go:

```sql
SELECT name, price
FROM menu
WHERE price > (SELECT AVG(price) FROM menu)
ORDER BY price DESC;
```

The average price of the seven items is about 14286, so the result is:

| name | price |
|---|---|
| Fried Rice | 25000 |
| Toast | 18000 |
| Milk Coffee | 15000 |

The number 14286 is not typed by hand. If a new item is added tomorrow, the average is worked out again by itself.

A subquery like this may also sit in `SELECT`, for example to show how far each price is from the highest price:

```sql
SELECT name, (SELECT MAX(price) FROM menu) - price AS difference
FROM menu
ORDER BY id;
```

## A subquery that gives a list

A one-column subquery with many rows gives a list, and `IN` tests whether a value is in that list. The items ordered on 5 March:

```sql
SELECT name
FROM menu
WHERE id IN (SELECT menu_id FROM orders WHERE order_date = '2024-03-05')
ORDER BY id;
```

| name |
|---|
| Black Coffee |
| Milk Coffee |
| Banana Fritters |
| Fried Rice |

The difference from a `JOIN`: here every item is shown at most once, however many times it was ordered that day. `NOT IN` is the opposite: values that are not in the list.
