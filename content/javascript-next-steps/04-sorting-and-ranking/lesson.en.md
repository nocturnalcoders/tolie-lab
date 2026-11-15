---
title: Sorting and ranking
---
"Which product sold best this month?" To answer Laras, the data has to be **sorted** first, and then the top few are taken.

## sort and the compare function

Left alone, `sort` orders the entries as **text**, so even numbers are ordered like words in a dictionary:

```javascript
console.log([10, 9, 100].sort());   // [10,100,9]
```

So give `sort` a **compare function**. It takes two entries, `a` and `b`. When the result is negative, `a` goes first. When it is positive, `b` goes first.

```javascript
const prices = [85000, 30000, 45000];
prices.sort((a, b) => a - b);
console.log(prices);   // [30000,45000,85000]
```

`a - b` sorts from small to large, `b - a` from large to small.

## sort changes the original array

Unlike `map` and `filter`, `sort` changes the array it sorts. To keep the original data safe, copy it first with `[...array]`:

```javascript
const products = [
  { name: "Desk Lamp", sold: 10 },
  { name: "Paper Lantern", sold: 12 },
  { name: "Scented Candle", sold: 7 },
];
const ranked = [...products].sort((a, b) => b.sold - a.sold);
console.log(ranked[0].name);     // Paper Lantern
console.log(products[0].name);   // Desk Lamp
```

When two entries have the same value (the compare result is `0`), they keep their original order.

## slice: take the top few

`slice(0, 3)` gives back a new array with at most the first three entries. If there are fewer than three, you get all of them with no error:

```javascript
const topTwo = ranked.slice(0, 2);
```

## Rank numbers

The function inside `map` may take a second parameter: the **index** of the entry, starting from 0.

```javascript
const lines = ranked.map((p, i) => `${i + 1}. ${p.name}`);
console.log(lines.join("\n"));
```

`join("\n")` glues the entries of an array into one text, one line per entry:

```
1. Paper Lantern
2. Desk Lamp
3. Scented Candle
```
