---
title: Adding rows with INSERT INTO
---
An empty table is not much use. Today **Senja Coffee Shop** has a new item, and Ms. Rina asks you to put it into the `menu` table:

| id | name | category | price |
|---|---|---|---|
| 1 | Black Coffee | drink | 10000 |
| 2 | Milk Coffee | drink | 15000 |
| 3 | Pulled Tea | drink | 12000 |

## One row

`INSERT INTO` adds a new row. Name the table, list the columns, then give the values in the same order:

```sql
INSERT INTO menu (id, name, category, price)
VALUES (4, 'Sweet Iced Tea', 'drink', 8000);
```

Text goes inside single quotes, numbers do not. The first value goes into the first column in the list, the second value into the second column, and so on.

The column list may be left out. In that case the values must be complete and follow the order of the table's columns:

```sql
INSERT INTO menu VALUES (4, 'Sweet Iced Tea', 'drink', 8000);
```

Writing the column list is safer: you do not have to remember the column order, and the statement stays correct if a column is added to the table one day.

## Many rows at once

One `INSERT` can carry several rows, separated by commas:

```sql
INSERT INTO menu (id, name, category, price) VALUES
  (5, 'Toast', 'food', 18000),
  (6, 'Banana Fritters', 'food', 12000);
```

## Columns you leave out

A column that is not in the list is left empty. Empty in SQL is written `NULL`, meaning "no value".

There is one very useful exception. When the `id` column was created as `INTEGER PRIMARY KEY` (covered in lesson 5), the database fills it in by itself with the next number:

```sql
INSERT INTO customers (name, city) VALUES ('Sari', 'Bandung');
```

If the highest `id` right now is 2, this new row gets `id` 3. You do not need to know the last number.

## Checking the result

`INSERT` shows nothing. To see what happened, run a `SELECT` afterwards:

```sql
SELECT * FROM menu ORDER BY id;
```
