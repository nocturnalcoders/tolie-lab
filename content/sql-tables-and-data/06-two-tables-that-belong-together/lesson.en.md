---
title: Two tables that belong together
---
Ms. Rina wants to know **who** ordered what at **Senja Coffee Shop**. Writing the customer's name on every order is fragile: if Sari orders ten times, one typo ("Sri") makes her count as somebody else.

Better: each customer is recorded **once** in a table of their own, and every order just stores that customer's `id`.

The `customers` table:

| id | name |
|---|---|
| 1 | Sari |
| 2 | Budi |

The `orders` table:

| id | customer_id | item | quantity |
|---|---|---|---|
| 1 | 1 | Milk Coffee | 2 |
| 2 | 2 | Toast | 1 |
| 3 | 1 | Banana Fritters | 1 |

Orders 1 and 3 belong to customer 1, who is Sari.

## Foreign key

The `customer_id` column is called a **foreign key**: its value points at an `id` in another table. That link is declared with `REFERENCES`:

```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  item TEXT,
  quantity INTEGER
);
```

The `customers` table is created first, because `orders` points at it. All of Sari's orders can be found with an ordinary `WHERE`:

```sql
SELECT item, quantity FROM orders WHERE customer_id = 1;
```

## Order matters

The database makes sure no order points at a customer who does not exist. That gives two sequences to remember:

- **Adding**: the customer first, then their orders.
- **Deleting**: their orders first, then the customer.

The other way round, the statement is rejected with `FOREIGN KEY constraint failed`:

```sql
DELETE FROM customers WHERE id = 1;  -- rejected: Sari still has orders

DELETE FROM orders WHERE customer_id = 1;
DELETE FROM customers WHERE id = 1;  -- now it is allowed
```

One honest note: SQLite, the database this course uses, only enforces this once it is switched on with `PRAGMA foreign_keys = ON;`. In the second exercise it has already been run for you.
