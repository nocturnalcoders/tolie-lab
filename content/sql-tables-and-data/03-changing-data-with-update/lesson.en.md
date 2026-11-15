---
title: Changing data with UPDATE
---
Milk got more expensive, so Ms. Rina is raising the price of Milk Coffee at **Senja Coffee Shop**. The row is already in the `menu` table. Only its contents need to change.

| id | name | category | price |
|---|---|---|---|
| 1 | Black Coffee | drink | 10000 |
| 2 | Milk Coffee | drink | 15000 |
| 5 | Toast | food | 18000 |

## UPDATE ... SET ... WHERE

```sql
UPDATE menu
SET price = 17000
WHERE id = 2;
```

Read it as: in the `menu` table, make `price` 17000, **on the row whose `id` is 2**. This `WHERE` is exactly the `WHERE` you know from `SELECT`: it picks which rows are affected.

Several columns can be changed at once, separated by commas:

```sql
UPDATE menu
SET name = 'Palm Sugar Milk Coffee', price = 18000
WHERE id = 2;
```

## A new value from the old one

The right-hand side of `=` may be a calculation that uses the column's old value. This raises every drink by 1000:

```sql
UPDATE menu
SET price = price + 1000
WHERE category = 'drink';
```

One statement changes every row that matches the `WHERE`: that can be one row, many rows, or none at all. If nothing matches, nothing changes and there is no error message.

## The danger of forgetting WHERE

```sql
UPDATE menu SET price = 17000;
```

Without `WHERE`, **every row** is affected. The whole menu now costs 17000 and the old prices are gone. The database does not ask "are you sure?" and there is no undo button.

A habit that saves you: before an `UPDATE`, first run a `SELECT` with the same `WHERE`.

```sql
SELECT * FROM menu WHERE id = 2;
```

If the rows that come back are the ones you mean to change, then write the `UPDATE` with that `WHERE`. Picking rows by `id` is safest, because an `id` is never duplicated, while a name can be mistyped or shared.
