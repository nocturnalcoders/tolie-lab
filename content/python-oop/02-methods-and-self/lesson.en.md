---
title: Methods and self
---
A `MenuItem` object already stores data. Now we give it abilities: working things out and displaying itself. A function written inside a class is called a **method**.

## Methods: functions that belong to an object

```python
class MenuItem:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def subtotal(self, quantity):
        return self.price * quantity


coffee = MenuItem("milk coffee", 15000)
print(coffee.subtotal(2))   # 30000
```

The first parameter of every method is `self`. When you write `coffee.subtotal(2)`, Python fills `self` with `coffee` and `quantity` with `2`. Through `self` the method reads its own object's data, so the price does not have to be passed in again.

## Methods that change the object

```python
    def raise_price(self, extra):
        self.price = self.price + extra
```

```python
coffee.raise_price(1000)
print(coffee.price)   # 16000
```

This method returns nothing. It changes an attribute, and the change stays stored in the object.

## Displaying an object with `__str__`

Try `print(coffee)`. The result is not much use: `<__main__.MenuItem object at 0x...>`. Python does not know how to write out a menu item until you tell it through the special method `__str__`:

```python
    def __str__(self):
        return f"{self.name} (Rp{self.price})"
```

```python
print(coffee)               # milk coffee (Rp16000)
print(f"Order: {coffee}")   # Order: milk coffee (Rp16000)
```

Two things that are easy to miss:

- `__str__` must **return** the text with `return`, not print it with `print`.
- Leaving `self` out of the parameter list makes the call fail with a `TypeError`, because Python still sends the object as the first argument.
