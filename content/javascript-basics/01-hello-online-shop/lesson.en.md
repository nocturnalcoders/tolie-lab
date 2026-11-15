---
title: Hello, Online Shop!
---
Sekar sells handmade knitted bags, hats and scarves through a small online shop called **Sekar Knits**. Until now she has done all the sums in a notebook. You have been asked to help with JavaScript, the language used by almost every website.

## Showing text with `console.log`

```javascript
console.log("A new order came in!");
```

The result:

```
A new order came in!
```

Text is wrapped in quotes, either `"..."` or `'...'`. Numbers are written without quotes. Every `console.log` writes one line. A line that starts with `//` is a comment and is ignored.

## Storing values: `const` and `let`

A value can be given a name so you can use it again:

```javascript
const productName = "Knit hat"; // will not change
let stock = 8;                  // may change

stock = stock - 1;
console.log(stock); // 7
```

Use `const` for a value that stays the same, and `let` for a value you will replace later. Replacing the value of a `const` stops the program with an error. Make it a habit to start with `const` and switch to `let` only when you really need to.

## Putting values inside text

Text wrapped in **backticks** (the `` ` `` key, left of the 1 on most keyboards) can have values inserted with `${...}`:

```javascript
const price = 45000;
console.log(`${productName}: Rp${price}`);
```

The result:

```
Knit hat: Rp45000
```

Text like this is called a *template literal*. With ordinary quotes, `${price}` would appear exactly as typed, so make sure you use backticks.

Write your code in the editor next to this text and press **Check answer**. When every test is green, the exercise is done.
