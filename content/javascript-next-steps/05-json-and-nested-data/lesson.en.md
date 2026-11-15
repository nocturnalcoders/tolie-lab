---
title: JSON and nested data
---
Lentera Shop's orders are not typed straight into the program. The data arrives from a server or a file as **text** in the JSON format. Before you can work with it, that text has to be turned into an object.

## JSON.parse: from text to object

```javascript
const text = '{"id":"L-101","buyer":{"name":"Dimas","city":"Bandung"}}';
const order = JSON.parse(text);
console.log(order.id);   // L-101
```

`text` is only a row of characters, so `text.id` gives `undefined`. Only after `JSON.parse` can you read what is inside like any other object.

## Nested data

An object may hold other objects or arrays. Read it one step at a time with dots and square brackets:

```javascript
const order = {
  id: "L-101",
  buyer: { name: "Dimas", city: "Bandung" },
  items: [
    { name: "Desk Lamp", quantity: 1 },
    { name: "Scented Candle", quantity: 2 },
  ],
};
console.log(order.buyer.city);      // Bandung
console.log(order.items[1].name);   // Scented Candle
console.log(order.items.length);    // 2
```

Because `order.items` is an array, every method you have learned works on it: `map`, `filter`, `reduce`.

## Destructuring: take several entries at once

Instead of writing `order.` over and over, pull the entries out into variables with the same names:

```javascript
const { id, buyer } = order;
const { name, city } = buyer;
console.log(`${id}: ${name} (${city})`);   // L-101: Dimas (Bandung)
```

## JSON.stringify: from object to text

To store or send data, turn it back into text:

```javascript
const product = { name: "Scented Candle", stock: 5 };
const result = JSON.stringify(product);
console.log(result);          // {"name":"Scented Candle","stock":5}
console.log(typeof result);   // string
```

`typeof` tells you what kind of value something is. Here it says `string`, which means `result` is now text and no longer an object.
