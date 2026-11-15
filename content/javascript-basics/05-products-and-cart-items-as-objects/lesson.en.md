---
title: Products and Cart Items as Objects
---
A product has a name, a price and a stock count. Keeping them in three separate variables gets messy fast. An **object** ties related data together into one thing.

## Making an object

```javascript
const product = {
  name: "Knit bag",
  price: 85000,
  stock: 12,
};
```

An object is written inside `{ }` and holds pairs of **property name: value**, separated by commas.

## Reading and changing properties

Use a dot:

```javascript
console.log(product.name);  // Knit bag
console.log(product.price); // 85000

product.stock = product.stock - 1;
console.log(product.stock); // 11
```

Just like an array, the contents of an object may change even though the object was made with `const`. Reading a property that does not exist gives `undefined`, which is usually a sign of a typo.

## Objects and functions

A function can take an object as a parameter:

```javascript
function productLabel(p) {
  return `${p.name} (Rp${p.price})`;
}

console.log(productLabel(product)); // Knit bag (Rp85000)
```

A function can also build a new object and return it:

```javascript
function makeProduct(name, price) {
  return { name: name, price: price, stock: 0 };
}
```

## Cart items

One line in the Sekar Knits shopping cart is an object with three properties:

```javascript
const item = { name: "Scarf", price: 60000, quantity: 2 };
```

When an object is shown with `console.log`, the result here is written compactly, with the properties in the order they were written:

```
{"name":"Scarf","price":60000,"quantity":2}
```
