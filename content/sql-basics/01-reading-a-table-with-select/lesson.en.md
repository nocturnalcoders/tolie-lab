---
title: Reading a table with SELECT
---
The records of **Senja Coffee Shop** now live in a **database**. Ms. Rina wants you to be able to ask that data questions directly, and the language for asking a database questions is **SQL**.

## Tables, rows and columns

A database keeps data in **tables**, much like a spreadsheet. Each **row** is one record, and each **column** is one kind of detail. This is the `menu` table:

| id | name | category | price |
|---|---|---|---|
| 1 | Black Coffee | drink | 10000 |
| 2 | Milk Coffee | drink | 15000 |
| 3 | Pulled Tea | drink | 12000 |
| 4 | Sweet Iced Tea | drink | 8000 |
| 5 | Toast | food | 18000 |
| 6 | Banana Fritters | food | 12000 |
| 7 | Fried Rice | food | 25000 |

## SELECT

`SELECT` fetches data from a table. The `*` sign means every column:

```sql
SELECT * FROM menu;
```

Usually we only need a few columns. Name them, separated by commas:

```sql
SELECT name, category FROM menu;
```

An SQL statement ends with a semicolon. The capital letters in `SELECT` and `FROM` are only a habit that makes queries easier to read. A line that starts with `--` is a comment.

## Calculating and naming a column

A column can be a calculation, and `AS` gives the result a name:

```sql
SELECT name, price * 2 AS price_for_two FROM menu;
```

## The order of rows

A database makes no promise about the order of rows. To make the result certain, add `ORDER BY id` at the end (sorted by the `id` column). Sorting is covered properly in lesson 3.

```sql
SELECT name, price FROM menu ORDER BY id;
```

Results are shown as text: the first line holds the column names, then one line per row, separated by `|`. You can see the tables each exercise uses next to the editor.
