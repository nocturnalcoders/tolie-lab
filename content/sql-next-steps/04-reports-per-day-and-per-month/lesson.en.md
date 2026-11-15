---
title: Reports per day and per month
---
The order records of Senja Coffee Shop have grown, from late February to early April 2024. The `menu` table is unchanged, and this is the `orders` table:

| id | order_date | menu_id | quantity |
|---|---|---|---|
| 1 | 2024-02-26 | 2 | 2 |
| 2 | 2024-02-26 | 5 | 1 |
| 3 | 2024-02-28 | 3 | 3 |
| 4 | 2024-03-01 | 2 | 1 |
| 5 | 2024-03-01 | 7 | 2 |
| 6 | 2024-03-15 | 1 | 4 |
| 7 | 2024-03-27 | 2 | 3 |
| 8 | 2024-03-29 | 6 | 3 |
| 9 | 2024-03-31 | 5 | 2 |
| 10 | 2024-04-01 | 2 | 2 |
| 11 | 2024-04-01 | 1 | 3 |
| 12 | 2024-04-02 | 7 | 1 |

## Dates are text

SQLite stores a date as `year-month-day` text. Because the year comes first and the numbers always have two digits, alphabetical order is the same as order in time. That is why `ORDER BY order_date` and a comparison like this one work:

```sql
SELECT COUNT(*) AS march_orders
FROM orders
WHERE order_date >= '2024-03-01' AND order_date < '2024-04-01';
```

The result is `6`.

## strftime: taking part of a date

`strftime(format, date)` builds a new text from a date. `%Y` is the year, `%m` the month and `%d` the day. With `'%Y-%m'` every date turns into a month text, which can go straight into `GROUP BY`:

```sql
SELECT strftime('%Y-%m', order_date) AS month, SUM(quantity) AS servings
FROM orders
GROUP BY month
ORDER BY month;
```

| month | servings |
|---|---|
| 2024-02 | 6 |
| 2024-03 | 15 |
| 2024-04 | 6 |

## date: shifting a date

`date(date, shift)` works out a new date and knows the calendar, leap years included:

```sql
SELECT date('2024-02-28', '+1 day') AS tomorrow,
       date('2024-03-31', '-7 days') AS a_week_ago;
```

The result is `2024-02-29|2024-03-24`. Another shift is `'+1 month'`. What `date` returns is ordinary date text, so it can be compared with the `order_date` column in `WHERE`.
