---
title: Keeping data correct
---
So far nothing stops `MenuItem("milk coffee", -5000)`. That negative price would then be counted on every receipt. A good object rejects data that makes no sense from the very start.

## Rejecting with raise

In Python Next Steps you **caught** a `ValueError`. Now you are the one who **raises** it:

```python
class MenuItem:
    def __init__(self, name, price):
        if price <= 0:
            raise ValueError("Price must be more than 0")
        self.name = name
        self.price = price
```

`raise` stops the method at once and sends the error to the code that called it. The object is never created.

## Catching it outside the class

```python
try:
    item = MenuItem("milk coffee", -5000)
    print("Saved")
except ValueError as e:
    print(f"Rejected: {e}")
```

This shows `Rejected: Price must be more than 0`. The `as e` part stores the error in the variable `e`, and printing it gives the message. The class decides **what is wrong**, the caller decides **what to do about it**.

## Guarding changes

The same kind of check belongs in methods that change data:

```python
class MenuStock:
    def __init__(self, name, stock):
        self.name = name
        self.stock = stock

    def sell(self, quantity):
        if quantity > self.stock:
            raise ValueError("Not enough stock")
        self.stock -= quantity
```

Check first, change afterwards. If the request is rejected, `stock` is left untouched.

## Properties: values that are worked out

```python
    @property
    def sold_out(self):
        return self.stock == 0
```

`@property` lets a method be read like an attribute, without brackets: `toast.sold_out`. Its value is worked out every time it is read, so it never falls behind `stock`. And because it cannot be set directly (Python refuses `toast.sold_out = True`), it cannot be made wrong either.
