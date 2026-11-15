---
title: Finding and checking data
---
Buyers often ask in chat: "Is the Scented Candle still available?" or "Is shipping to Cimahi free?" To answer, Laras does not need the whole list, only **one** product or a yes/no answer.

## find: take one entry

`find` gives back the **first** entry that matches, not an array:

```javascript
const products = [
  { name: "Desk Lamp", price: 85000, stock: 4 },
  { name: "Scented Candle", price: 30000, stock: 0 },
  { name: "Paper Lantern", price: 45000, stock: 7 },
];
const candle = products.find((p) => p.name === "Scented Candle");
console.log(candle.price);   // 30000
```

When nothing matches, the result is `undefined`. Reading `.price` from `undefined` stops the program with an error, so check first:

```javascript
const fan = products.find((p) => p.name === "Electric Fan");
if (fan === undefined) {
  console.log("Product not found");
}
```

## some and every: a yes or no answer

`some` is `true` when **at least one** entry matches. `every` is `true` when **all** entries match:

```javascript
console.log(products.some((p) => p.stock === 0));   // true
console.log(products.every((p) => p.stock > 0));    // false
```

Be careful with an empty array: `some` gives `false` (nothing matches), while `every` gives `true` (nothing breaks the rule). When an empty array needs its own answer, check `products.length === 0` first.

## includes: is the value in there

For an array of texts or numbers, `includes` checks whether a value is in it:

```javascript
const freeShipping = ["Bandung", "Cimahi"];
console.log(freeShipping.includes("Cimahi"));   // true
console.log(freeShipping.includes("cimahi"));   // false
```

The comparison has to match exactly, including upper and lower case. For an array of objects, use `some` or `find` with a condition you write yourself.
