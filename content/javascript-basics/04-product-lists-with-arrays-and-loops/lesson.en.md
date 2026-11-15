---
title: Product Lists with Arrays and Loops
---
An order rarely holds just one item. To store many values at once, JavaScript has the **array**: an ordered list of values.

## Making and reading an array

```javascript
const products = ["Knit bag", "Knit hat", "Scarf"];

console.log(products[0]);     // Knit bag
console.log(products.length); // 3
```

Positions are counted **from 0**, so the first item is at `products[0]` and the last one at `products[products.length - 1]`.

## Adding an item

```javascript
products.push("Keychain");
console.log(products.length); // 4
```

`push` adds an item to the end of the array. This is allowed even though `products` was made with `const`: what is not allowed is replacing `products` with a different array.

## Visiting every item with `for...of`

```javascript
const orderPrices = [85000, 45000, 60000];

for (const price of orderPrices) {
  console.log(`Rp${price}`);
}
```

The lines inside `{ }` run once for every item in the array, and `price` takes a new value on every round.

## Pattern: adding up

Set up a holder outside the loop, then add to it bit by bit:

```javascript
let itemCount = 0;
for (const quantity of [2, 1, 3]) {
  itemCount = itemCount + quantity;
}
console.log(itemCount); // 6
```

The holder uses `let` because its value keeps changing. The same pattern collects items into a new array: start from `[]`, then `push` the items that pass an `if` check.

When an array is shown with `console.log`, the result here is written compactly, like `[85000,45000]`.
