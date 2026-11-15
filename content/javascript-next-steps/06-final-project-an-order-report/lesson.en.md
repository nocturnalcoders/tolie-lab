---
title: "Final project: an order report"
---
Every evening Laras wants one short report: how many orders were completed, how many were cancelled, what the revenue is, and which order was the largest. You already have every tool. Now it is a matter of putting them together.

## The shape of the data

Every order is an object that holds an array of items:

```javascript
const orders = [
  { id: "L-101", buyer: "Dimas", status: "done",
    items: [{ name: "Desk Lamp", price: 85000, quantity: 1 }] },
  { id: "L-102", buyer: "Sari", status: "cancelled",
    items: [{ name: "Scented Candle", price: 30000, quantity: 2 }] },
];
```

## Step 1: a small function for one order

Start from the smallest question, for example how many items are in **one** order:

```javascript
const itemCount = (order) =>
  order.items.reduce((t, item) => t + item.quantity, 0);
```

## Step 2: keep, then boil down

Cancelled orders do not count. Keep the right ones with `filter` first, then boil them down with `reduce`, calling the small function along the way:

```javascript
const done = orders.filter((o) => o.status === "done");
const shipped = done.reduce((t, o) => t + itemCount(o), 0);
console.log(done.length, shipped);   // 1 1
```

## Step 3: the largest one

Sort a copy from large to small, then take the first entry. On an empty array that gives `undefined`, so check before using it:

```javascript
const biggest = [...done].sort(
  (a, b) => itemCount(b) - itemCount(a)
)[0];
const text = biggest === undefined ? "-" : biggest.id;
```

The form `condition ? valueIfTrue : valueIfFalse` is a short `if...else` that produces a value.

## Step 4: build the report

Collect every line in an array, then glue them together with `join("\n")`:

```javascript
const lines = [
  `Completed orders: ${done.length}`,
  `Items shipped: ${shipped}`,
  `Biggest order: ${text}`,
];
console.log(lines.join("\n"));
```

This pattern fits almost any report: a small function, keep, boil down, then build.
