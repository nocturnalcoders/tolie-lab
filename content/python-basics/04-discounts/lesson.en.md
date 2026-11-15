---
title: Discounts with if and else
---
Ms. Rina has a new rule: **spend Rp100,000 or more and get a 10% discount**. The program now has to make a decision.

## Comparisons

A comparison gives `True` or `False`:

| Written | Meaning |
| --- | --- |
| `a == b` | equal to |
| `a != b` | not equal to |
| `a > b` | greater than |
| `a >= b` | greater than or equal to |
| `a < b` | less than |
| `a <= b` | less than or equal to |

Careful: `=` stores a value, while `==` compares.

## if, elif, else

```python
total = 120000

if total >= 100000:
    print("Gets a discount")
else:
    print("No discount yet")
```

The lines inside the `if` must be **indented** (four spaces). That is how Python knows which lines belong to it. For more than two choices, use `elif`:

```python
if quantity >= 10:
    print("Large")
elif quantity >= 3:
    print("Medium")
else:
    print("Small")
```

Python checks from the top and stops at the first choice that is true.

## Calculating percentages

A 10% discount means paying 90%. With whole numbers: `total * 90 // 100`.
