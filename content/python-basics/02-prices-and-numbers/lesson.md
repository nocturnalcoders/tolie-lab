---
title: Prices and numbers
---
Ms. Rina asks, "If someone buys two milk coffees, what is the total?" A computer can work that out, as long as we give the numbers names. (Prices here are in Indonesian rupiah, Rp.)

## Variables

A **variable** is a name for a stored value:

```python
price = 15000
quantity = 2
total = price * quantity
print(total)
```

The result is `30000`. The `=` sign here means "store the value on the right under the name on the left".

## Arithmetic

| Operator | Meaning | Example | Result |
| --- | --- | --- | --- |
| `+` | add | `7 + 2` | `9` |
| `-` | subtract | `7 - 2` | `5` |
| `*` | multiply | `7 * 2` | `14` |
| `/` | divide (decimal result) | `7 / 2` | `3.5` |
| `//` | divide (rounded down) | `7 // 2` | `3` |
| `%` | remainder | `7 % 2` | `1` |

The order is the same as in maths: multiply and divide come before add and subtract. Use parentheses to change the order.

## Reading numbers from input

`input()` reads one line the user typed, and the result is always **text**. Turn it into a number with `int()`:

```python
quantity = int(input())
```

In the exercises the input values are prepared by the tests, so you do not have to type them yourself.
