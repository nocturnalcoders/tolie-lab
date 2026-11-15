---
title: Removing rows with DELETE
---
Not all data has to be kept forever. Some items stop being sold, some orders were typed in wrong. At **Senja Coffee Shop** the cashier sometimes saves an order with a quantity of 0 by accident:

| id | order_date | menu_id | quantity |
|---|---|---|---|
| 1 | 2024-03-04 | 2 | 2 |
| 2 | 2024-03-04 | 5 | 1 |
| 3 | 2024-03-04 | 3 | 0 |
| 4 | 2024-03-04 | 2 | 1 |

## DELETE FROM ... WHERE

```sql
DELETE FROM orders
WHERE id = 3;
```

`DELETE` throws away **whole rows**, not a single column. That is why there is no column list after `DELETE`. If you only want to empty one column, use `UPDATE`.

As with `UPDATE`, the `WHERE` decides which rows are affected, and the condition may match many rows at once:

```sql
DELETE FROM orders
WHERE quantity = 0;
```

Conditions can be combined with `AND` and `OR`, just as in `SELECT`:

```sql
DELETE FROM orders
WHERE order_date = '2024-03-04' AND quantity = 0;
```

If no row matches, nothing is deleted and there is no error message.

## Forgetting WHERE, again

```sql
DELETE FROM orders;
```

Without `WHERE`, **every row** is deleted. The table is still there, the columns are still there, and it is empty. Deleted rows cannot be called back.

So the habit is the same: look first, then delete.

```sql
SELECT * FROM orders WHERE quantity = 0;
```

If the rows that come back are the ones to throw away, replace `SELECT *` with `DELETE` and leave the `WHERE` exactly as it is.

## DELETE is not DROP TABLE

Another statement sounds similar:

```sql
DROP TABLE orders;
```

`DROP TABLE` throws away **the table itself**, columns and all rows. After that, `SELECT * FROM orders` fails with the message `no such table`. `DELETE` deals with rows, `DROP TABLE` deals with tables.

## Missing numbers

After row 3 is deleted, the remaining `id` values are 1, 2, 4. That is normal and needs no tidying up. An `id` is an identifier, not a position in a list.
