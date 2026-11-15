---
title: Filtering rows with WHERE
---
Customers often ask: "Which drinks are under fifteen thousand?" To answer, we do not need every row, only the ones that meet a condition. That is the job of `WHERE`.

The `menu` table is still the same:

| id | name | category | price |
|---|---|---|---|
| 1 | Black Coffee | drink | 10000 |
| 2 | Milk Coffee | drink | 15000 |
| 3 | Pulled Tea | drink | 12000 |
| 4 | Sweet Iced Tea | drink | 8000 |
| 5 | Toast | food | 18000 |
| 6 | Banana Fritters | food | 12000 |
| 7 | Fried Rice | food | 25000 |

## Comparison conditions

`WHERE` goes after `FROM`. Only rows where the condition is true are shown:

```sql
SELECT name, price FROM menu WHERE price > 15000 ORDER BY id;
```

The result is Toast and Fried Rice. The comparisons are `=`, `<>` (not equal), `<`, `<=`, `>`, `>=`. Text is written in single quotes:

```sql
SELECT name FROM menu WHERE category = 'food' ORDER BY id;
```

## AND and OR

`AND` needs both conditions to be true, `OR` is satisfied by either one:

```sql
SELECT name FROM menu
WHERE category = 'food' AND price >= 18000
ORDER BY id;
```

When `AND` and `OR` are mixed, use brackets to make the meaning clear, because `AND` is worked out first.

## Searching text with LIKE

`LIKE` matches a pattern. The `%` sign means "any text, possibly empty":

```sql
SELECT name FROM menu WHERE name LIKE '%Coffee' ORDER BY id;
```

The result is Black Coffee and Milk Coffee. `'Fried%'` means starts with Fried, `'%Coffee'` means ends with Coffee, and `'%Tea%'` means contains Tea anywhere.

The writing order is always: `SELECT ... FROM ... WHERE ... ORDER BY ...`.
