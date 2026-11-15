---
title: Rules on columns
---
So far a table accepts anything: an item without a name, a negative price, two customers with the same `id`. Ms. Rina does not want the data of **Senja Coffee Shop** to look like this:

| id | name | category | price |
|---|---|---|---|
| 1 | Black Coffee | drink | 10000 |
| 1 | Milk Coffee | NULL | -15000 |
| 3 | NULL | food | 0 |

Rules (*constraints*) are written after the column type when you create the table. A row that breaks one is rejected with an error message, and the table does not change.

```sql
CREATE TABLE menu (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'drink',
  price INTEGER NOT NULL CHECK (price > 0)
);
```

## Five rules

| Rule | Meaning |
|---|---|
| `PRIMARY KEY` | the row's identifier: must differ on every row |
| `NOT NULL` | the column may not be empty |
| `UNIQUE` | no two rows may hold the same value |
| `DEFAULT value` | the value used when the column is left out of an `INSERT` |
| `CHECK (condition)` | the value must meet the condition in the brackets |

One column may carry several rules, separated by spaces.

## PRIMARY KEY

Every table should have one identifying column, usually `id`. With `INTEGER PRIMARY KEY` the number is filled in automatically when you leave `id` out of an `INSERT`, as in lesson 2.

## DEFAULT and CHECK

```sql
INSERT INTO menu (name, price) VALUES ('Pulled Tea', 12000);
```

`category` is not mentioned, so it holds `'drink'`, not `NULL`. The condition inside `CHECK` is written like a `WHERE` condition:

```sql
INSERT INTO menu (name, price) VALUES ('Toast', 0);
```

This statement is rejected with `CHECK constraint failed`, because 0 is not greater than 0.

Rules guard the data at the door: a typing mistake is caught right then, not a month later when a report looks odd.

In the exercises, the checker tries to insert several rows into your table, including rows that break the rules. Those rows must be rejected, so that only the valid rows remain.
