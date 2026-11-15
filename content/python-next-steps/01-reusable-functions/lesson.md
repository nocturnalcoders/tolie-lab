---
title: Functions you can reuse
---
Senja Coffee Shop is getting busier, and Ms. Rina's program is getting longer. The same formula is written in many places, so when something changes it has to be fixed one spot at a time. In the basics course you met **functions**. Now we use them as the main tool for keeping code tidy.

## Several parameters

A function can take more than one parameter, separated by commas:

```python
def subtotal(price, quantity):
    return price * quantity

print(subtotal(15000, 2))   # 30000
print(subtotal(12000, 3))   # 36000
```

The order in the call follows the order of the parameters: `15000` goes into `price`, `2` goes into `quantity`.

## A function's result is an ordinary value

The value from `return` can be stored, used in another calculation, or dropped straight into an f-string:

```python
total = subtotal(15000, 2) + subtotal(18000, 1)
print(f"Total: Rp{total}")   # Total: Rp48000
```

A function with no `return` gives back `None`. If your result shows up as `None`, the `return` is usually missing.

## Functions that return text

Ms. Rina wants prices written the Indonesian way, with dots between the thousands, like `Rp15.000`. The `:,` format adds comma separators, then `.replace` swaps them for dots:

```python
def rupiah(amount):
    return "Rp" + f"{amount:,}".replace(",", ".")

print(rupiah(1250000))   # Rp1.250.000
```

Written once, `rupiah` can be used across the whole program. If the format changes, there is only one place to fix.
