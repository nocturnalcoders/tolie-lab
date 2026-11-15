---
title: Functions and the sales report
---
In the last lesson we put everything together. First, tidying code up with **functions**. Then building the sales report Ms. Rina really uses.

## Functions

A function is a named block of code that can be called again and again:

```python
def amount_to_pay(total):
    if total >= 100000:
        return total * 90 // 100
    return total

print(amount_to_pay(250000))   # 225000
```

- `def` creates the function, and `total` is a **parameter** (data going in).
- `return` sends the result back to the caller. Code after `return` does not run.
- Unlike `print`, `return` shows nothing. The result is used by the code that called the function.

## Reading formatted lines

Sales data arrives as lines like `name,quantity,price`. Split them, then turn the numbers into numbers:

```python
name, quantity, price = "milk coffee,10,15000".split(",")
quantity = int(quantity)
price = int(price)
```

## Project: the sales report

The first line holds the number of data lines. Each line after it is `name,quantity,price`. The report must show the **total sales** and the **best seller** (the most units sold).
