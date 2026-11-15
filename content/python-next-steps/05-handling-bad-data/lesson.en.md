---
title: Handling bad data
---
One afternoon Ms. Rina's program stopped halfway. The cause was a single row: the cashier had typed `two` in the quantity column. One typo should not sink a whole day's report.

## An error stops the program

```python
quantity = int("two")
```

Python stops and shows `ValueError: invalid literal for int()`. The name at the front, `ValueError`, is the **kind** of error: the value cannot be turned into a number.

## try and except

Put the code that might fail inside `try`. If an error happens, Python jumps to `except` and the program keeps running:

```python
text = input()
try:
    quantity = int(text)
    print(f"Quantity: {quantity}")
except ValueError:
    print("Not a number")
print("Done")
```

For the input `two`, this shows `Not a number` and then `Done`. The rest of the `try` block after the failing line does not run.

Always name the kind of error. A bare `except:` swallows every error, including typos in your own code, which makes mistakes hard to find.

## Valid numbers that make no sense

`int("-4")` works, yet an order quantity can never be negative. That kind of check still uses `if`:

```python
if quantity <= 0:
    print("Quantity must be more than 0")
```

## Skipping broken rows

Inside a loop, count the broken row and move on to the next one:

```python
broken = 0
for _ in range(n):
    try:
        name, quantity, price = input().split(",")
        total += int(quantity) * int(price)
    except ValueError:
        broken += 1
```

A row with too few columns, such as `toast,2`, also raises a `ValueError`, because two pieces cannot be handed out to three names. So one `except` catches both.
