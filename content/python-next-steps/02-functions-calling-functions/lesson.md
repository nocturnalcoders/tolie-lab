---
title: Functions that call functions
---
A function should do **one small thing**. Bigger jobs are then put together from those small functions, the way Ms. Rina puts an order together from several menu items.

## Combining functions

A function can call other functions:

```python
def subtotal(price, quantity):
    return price * quantity

def rupiah(amount):
    return "Rp" + f"{amount:,}".replace(",", ".")

def receipt_line(name, price, quantity):
    return f"{name} x{quantity} = {rupiah(subtotal(price, quantity))}"

print(receipt_line("milk coffee", 15000, 2))   # milk coffee x2 = Rp30.000
```

`receipt_line` does not need to know how to calculate or how to write rupiah. It simply calls the functions that already exist. Python works from the inside out: `subtotal` first, and its result goes into `rupiah`.

## Default values

Most customers are not members, so their discount is `0`. To avoid writing that every time, give the parameter a **default value**:

```python
def amount_to_pay(total, discount_percent=0):
    return total * (100 - discount_percent) // 100

print(amount_to_pay(50000))       # 50000, the discount uses the default 0
print(amount_to_pay(50000, 10))   # 45000
```

Parameters with a default value must come **after** the ones without.

## Naming the parameter

When calling, you may name the parameter to make the call easier to read:

```python
print(amount_to_pay(50000, discount_percent=10))   # 45000
```
