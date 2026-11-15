---
title: Objects that hold objects
---
One order at Senja Coffee Shop holds several menu items, each with a quantity. An object's attributes can hold anything, including lists and other objects. This is where small classes start working together.

## One order line

```python
class OrderLine:
    def __init__(self, item, quantity):
        self.item = item        # a MenuItem object
        self.quantity = quantity

    def subtotal(self):
        return self.item.price * self.quantity
```

Read `self.item.price` from the left: take this line's `item`, then take that item's `price`.

## An order holds many lines

```python
class Order:
    def __init__(self, customer):
        self.customer = customer
        self.lines = []

    def add(self, item, quantity):
        self.lines.append(OrderLine(item, quantity))

    def total(self):
        result = 0
        for line in self.lines:
            result += line.subtotal()
        return result
```

The empty list is created inside `__init__`, so every order has a list of its own. `total` does not multiply price by quantity itself. It simply asks each line through `line.subtotal()`. Every class looks after its own part.

## Using it

```python
coffee = MenuItem("milk coffee", 15000)
toast = MenuItem("toast", 18000)

o = Order("Siti")
o.add(coffee, 2)
o.add(toast, 1)

print(len(o.lines))            # 2
print(o.lines[0].item.name)    # milk coffee
print(o.total())               # 48000
```

Code that uses `Order` does not need to know how the lines are stored. It only calls `add` and `total`. If the way they are stored changes later, only the inside of the class has to be touched.
