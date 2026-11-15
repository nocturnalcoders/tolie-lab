---
title: Grouping with GROUP BY and HAVING
---
A summary of one day is done. But Ms. Rina wants a summary of **every** day at once, and wants to know which items sell best. Writing one statement per day or per item would clearly be tiring. `GROUP BY` does it in a single statement.

The `sales` table is the same as in the previous lesson: `id`, `sale_date`, `item`, `quantity`, `subtotal`, holding 11 transactions over three days.

## GROUP BY

`GROUP BY` gathers rows that share a value into one group, and the aggregate functions are then worked out **per group**:

```sql
SELECT sale_date, COUNT(*) AS transactions, SUM(subtotal) AS revenue
FROM sales
GROUP BY sale_date
ORDER BY sale_date;
```

| sale_date | transactions | revenue |
|---|---|---|
| 2024-03-01 | 4 | 117000 |
| 2024-03-02 | 4 | 141000 |
| 2024-03-03 | 3 | 108000 |

The result has one row per group. The rule: a column in `SELECT` must either be a column used in `GROUP BY`, or sit inside an aggregate function.

## Sorting by an aggregate

A name given with `AS` can be used in `ORDER BY`:

```sql
SELECT sale_date, SUM(subtotal) AS revenue
FROM sales
GROUP BY sale_date
ORDER BY revenue DESC, sale_date;
```

Now the busiest day comes out on top.

## HAVING

`WHERE` filters rows **before** they are grouped, so it cannot use the result of an aggregate. To filter **groups**, use `HAVING` after `GROUP BY`:

```sql
SELECT sale_date, SUM(subtotal) AS revenue
FROM sales
GROUP BY sale_date
HAVING SUM(subtotal) > 110000
ORDER BY sale_date;
```

Only 1 and 2 March are shown, because the revenue on 3 March was just 108000.

The full order: `SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT ...`.
