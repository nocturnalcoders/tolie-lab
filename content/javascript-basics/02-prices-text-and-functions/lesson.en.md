---
title: Prices, Text and Functions
---
Orders are picking up, and Sekar keeps repeating the same sum: price times quantity. A sum you repeat is best wrapped up in a **function**.

## Numbers

```javascript
console.log(85000 + 45000); // 130000
console.log(60000 * 2);     // 120000
console.log(100000 / 4);    // 25000
console.log(17 % 5);        // 2, the remainder of a division
```

## Text

A piece of text is called a *string*. Strings come with a few built-in tools:

```javascript
const name = "scarf";
console.log(name.length);        // 5, the number of characters
console.log(name.toUpperCase()); // SCARF
console.log("Rp" + 60000);       // Rp60000
```

The `+` sign adds numbers, but it **joins** when either side is a string. To avoid confusion, use a template literal to build text.

## Functions

A function is a recipe with a name. The ingredients that go in are called **parameters**, and the result is sent back out with `return`:

```javascript
function priceAfterCut(price, cut) {
  return price - cut;
}

console.log(priceAfterCut(85000, 5000)); // 80000
console.log(priceAfterCut(45000, 0));    // 45000
```

A function only does its work when it is **called** by its name followed by parentheses. One function can be called many times with different values.

## `return` is not `console.log`

`return` hands the result to whoever called the function, while `console.log` only shows it. A function without `return` gives back `undefined`.

From this lesson on, you only need to write the function. The tests call your function with several different values and show the result, so the function name must match the one asked for exactly.
