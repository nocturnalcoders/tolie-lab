---
title: Arrow functions, map and filter
---
Lentera Shop, a small online shop run by Laras, sells decorative lamps and candles. The data keeps growing: product lists, stock, orders. In the basics course you worked through arrays with `for...of`. Now we use **array methods**, a shorter way to do the same jobs.

## Arrow functions

An arrow function is a short way to write a function:

```javascript
const withShipping = (price) => price + 10000;
console.log(withShipping(50000));   // 60000
```

When the body is a single expression, you need neither `{}` nor `return`: the result of that expression is returned. When the body takes several lines, use `{}` and write `return` as usual.

## map: change every entry

`map` runs a function on every entry of an array and collects the results in a **new** array. The original array does not change:

```javascript
const prices = [85000, 30000, 45000];
const newPrices = prices.map((p) => p + 5000);
console.log(newPrices);   // [90000,35000,50000]
console.log(prices);      // [85000,30000,45000]
```

## filter: keep some entries

`filter` keeps only the entries for which its function gives `true`:

```javascript
const products = [
  { name: "Desk Lamp", price: 85000, stock: 4 },
  { name: "Scented Candle", price: 30000, stock: 0 },
  { name: "Paper Lantern", price: 45000, stock: 7 },
];
const cheap = products.filter((p) => p.price < 50000);
console.log(cheap.length);   // 2
```

When nothing matches, the result is an empty array `[]`, not an error.

## Chaining the two

Because `filter` gives back an array, you can put `map` straight after it:

```javascript
const cheapNames = products
  .filter((p) => p.price < 50000)
  .map((p) => p.name);
console.log(cheapNames);   // ["Scented Candle","Paper Lantern"]
```

Read it from top to bottom: first keep the cheap ones, then take only their names.
