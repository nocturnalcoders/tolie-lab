---
title: Making Decisions with if and else
---
Sekar Knits has a new rule: **orders of Rp200,000 or more ship for free**. The program now has to choose.

## Comparisons

A comparison gives `true` or `false`:

| Written | Meaning |
| --- | --- |
| `a === b` | equal to |
| `a !== b` | not equal to |
| `a > b` | greater than |
| `a >= b` | greater than or equal to |
| `a < b` | less than |
| `a <= b` | less than or equal to |

A single `=` stores a value, while `===` compares.

## `===`, not `==`

JavaScript also has `==`, but `==` quietly changes the type of a value before comparing:

```javascript
console.log("5" == 5);  // true, the text "5" is treated as a number
console.log("5" === 5); // false, text is not a number
```

Surprises like this are a common source of bugs. Make it a habit to always use `===` and `!==`.

## if, else if, else

```javascript
function shippingNote(total) {
  if (total >= 200000) {
    return "Free shipping";
  } else {
    return "Shipping Rp15000";
  }
}
```

The condition goes inside parentheses, and the lines that belong to it are wrapped in `{ }`. For more than two choices, use `else if`:

```javascript
function orderSize(quantity) {
  if (quantity >= 10) {
    return "Large";
  } else if (quantity >= 3) {
    return "Medium";
  } else {
    return "Small";
  }
}
```

JavaScript checks from the top and stops at the first condition that is true, so the order of the conditions matters. As soon as a `return` runs, the function is finished.
