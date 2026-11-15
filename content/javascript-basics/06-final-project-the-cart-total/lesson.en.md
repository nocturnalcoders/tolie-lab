---
title: "Final Project: The Cart Total"
---
Time to bring everything together. Sekar wants the cart page to work out by itself how much the shopper has to pay.

## A cart is an array of objects

```javascript
const cart = [
  { name: "Knit bag", price: 85000, quantity: 2 },
  { name: "Knit hat", price: 45000, quantity: 1 },
];
```

With `for...of`, every round gives you one object, and you read its properties with a dot:

```javascript
for (const item of cart) {
  console.log(`${item.name}: ${item.quantity} pcs`);
}
```

## The shop rules

1. The **subtotal** is the sum of price times quantity for every item in the cart.
2. A **10% discount** on the subtotal if the subtotal is Rp300,000 or more. Below that the discount is 0.
3. **Shipping** costs Rp15,000, and is free if the subtotal is Rp200,000 or more.
4. The **total to pay** is the subtotal minus the discount, plus shipping.

Ten percent of a number is worked out with `number * 10 / 100`.

## Break it into small functions

Do not write one giant function. Write one function for each rule, then combine them. A function may call other functions:

```javascript
function unitPrice(item) {
  return item.price;
}

function itemLabel(item) {
  return `${item.name} @ Rp${unitPrice(item)}`;
}
```

Small functions are easy to check one at a time. If the final total is wrong, you only need to find which piece gives the wrong result. And if the discount rule changes one day, there is just one function to touch.

Finish these last two exercises and the Sekar Knits cart is ready to use. Congratulations, you have written a JavaScript program that is truly useful!
