---
title: reduce and totals
---
`map` and `filter` give back arrays. But Laras's questions often need just **one value**: what is the total of this cart? How much stock does the whole shop hold? To boil an array down to one value, use `reduce`.

## How reduce works

`reduce` takes two things: a function and a **starting value**. The function is called for every entry with two parameters: the result so far and the entry being visited. Whatever it returns becomes the result so far for the next entry.

```javascript
const quantities = [2, 1, 3];
const total = quantities.reduce((soFar, n) => soFar + n, 0);
console.log(total);   // 6
```

The steps: start at `0`, then `0 + 2 = 2`, `2 + 1 = 3`, `3 + 3 = 6`.

Always write the starting value. With a starting value of `0`, an empty array gives `0`. Without one, an empty array stops the program with an error.

## A total from an array of objects

Every item in a cart has a price and a quantity. What gets added to the total is the two multiplied:

```javascript
const cart = [
  { name: "Desk Lamp", price: 85000, quantity: 1 },
  { name: "Scented Candle", price: 30000, quantity: 2 },
];
const total = cart.reduce((t, item) => t + item.price * item.quantity, 0);
console.log(total);   // 145000
```

## Boiling down to an object

The starting value does not have to be a number. Starting from an empty object `{}`, we can count how often each category appears:

```javascript
const categories = ["lamp", "candle", "lamp"];
const counts = categories.reduce((tally, c) => {
  tally[c] = (tally[c] || 0) + 1;
  return tally;
}, {});
console.log(counts);   // {"lamp":2,"candle":1}
```

`tally[c]` reads the key whose name is stored in `c`. The first time a category shows up its value is still `undefined`, so `tally[c] || 0` gives `0`. Do not forget `return tally`, because that is what gets passed on to the next entry.
