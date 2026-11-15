---
title: Creating a table with CREATE TABLE
---
So far you have read tables that already existed, using `SELECT`. This time Ms. Rina wants to record something new at **Senja Coffee Shop**, and there is no table for it yet. You are going to create it.

## CREATE TABLE

Creating a table means deciding on the **table name** and its **list of columns**. Each column has a name and a **data type**:

```sql
CREATE TABLE menu (
  id INTEGER,
  name TEXT,
  price INTEGER
);
```

The columns go inside the brackets, separated by commas, with no comma after the last one. A new table is empty: the columns are there, the rows are not.

## Three data types

| Type | Holds | Examples |
|---|---|---|
| `INTEGER` | whole numbers | `7`, `15000` |
| `TEXT` | text | `'Milk Coffee'`, `'2024-03-04'` |
| `REAL` | numbers with decimals | `2.5`, `0.25` |

To choose, ask what will be stored. A price in rupiah and a number of servings are always whole, so `INTEGER`. Names, categories and dates are text, so `TEXT`. A weight of coffee beans can be 2.5 kg, so `REAL`. In SQL the decimal separator is a dot, not a comma.

## Naming things

Use lowercase letters and underscores, no spaces: `name`, `purchase_date`. Pick names that say what is inside, because those are the names you will type in every `SELECT`.

## Trying out a new table

A new table can be filled and read straight away. Adding rows is covered fully in the next lesson, but this is what it looks like:

```sql
INSERT INTO menu VALUES (1, 'Black Coffee', 10000);
SELECT * FROM menu;
```

Two tables cannot share a name. If `CREATE TABLE menu` runs while a `menu` table already exists, the database refuses with the message `table menu already exists`.

In this course's exercises, your answer is checked by looking at **the state of the table after your statements have run**. That is why table names and column names must be exactly as asked.
