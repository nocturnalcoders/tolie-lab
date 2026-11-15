---
title: Daily totals with aggregate functions
---
Every night Ms. Rina wants to know: how many transactions were there today, and how much money came in? Sales are recorded in the `sales` table. One row is one transaction: the date, the item bought, the `quantity` of servings, and the `subtotal` in rupiah.

| id | sale_date | item | quantity | subtotal |
|---|---|---|---|---|
| 1 | 2024-03-01 | Milk Coffee | 3 | 45000 |
| 2 | 2024-03-01 | Toast | 1 | 18000 |
| 3 | 2024-03-01 | Pulled Tea | 2 | 24000 |
| 4 | 2024-03-01 | Milk Coffee | 2 | 30000 |
| 5 | 2024-03-02 | Black Coffee | 4 | 40000 |
| 6 | 2024-03-02 | Fried Rice | 2 | 50000 |
| 7 | 2024-03-02 | Milk Coffee | 1 | 15000 |
| 8 | 2024-03-02 | Banana Fritters | 3 | 36000 |
| 9 | 2024-03-03 | Pulled Tea | 1 | 12000 |
| 10 | 2024-03-03 | Milk Coffee | 4 | 60000 |
| 11 | 2024-03-03 | Toast | 2 | 36000 |

## Aggregate functions

An aggregate function sums many rows up into **one** value:

- `COUNT(*)` counts the rows
- `SUM(column)` adds up
- `AVG(column)` works out the average
- `MIN(column)` and `MAX(column)` find the smallest and largest value

```sql
SELECT COUNT(*) AS transactions, SUM(quantity) AS servings FROM sales;
```

The result is a single row: `11|25`. Name each one with `AS`, because without it the column would be called `COUNT(*)`.

## Aggregates with WHERE

`WHERE` filters first, then the aggregate works on the rows that are left:

```sql
SELECT SUM(subtotal) AS revenue FROM sales WHERE sale_date = '2024-03-02';
```

The result is `141000`. Dates are stored as `year-month-day` text, so they are written in quotes.

## Averages and rounding

An average is rarely a whole number. `ROUND(value)` rounds it to the nearest whole number:

```sql
SELECT ROUND(AVG(quantity)) AS average FROM sales;
```

The average is 2.27 servings per transaction, so the result is `2`.
