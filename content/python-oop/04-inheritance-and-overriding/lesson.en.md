---
title: Inheritance and overriding
---
Drinks at Senja Coffee Shop can be ordered in a large size for an extra Rp3000. Food has no sizes. Copying the whole `MenuItem` class for that one difference makes code hard to look after. **Inheritance** creates a new class that takes everything from an old one, then changes only what it needs to.

## The parent class

```python
class MenuItem:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def selling_price(self):
        return self.price

    def __str__(self):
        return f"{self.name}: Rp{self.selling_price()}"
```

## The child class

```python
class Drink(MenuItem):
    def __init__(self, name, price, size):
        super().__init__(name, price)
        self.size = size

    def selling_price(self):
        if self.size == "large":
            return self.price + 3000
        return self.price
```

The name in brackets, `MenuItem`, is the **parent class**. `Drink` inherits all of its methods. Two things are new here:

- `super().__init__(name, price)` runs the parent's `__init__`, so `name` and `price` are stored without being written again. Only then is the extra attribute filled in.
- `selling_price` is written again with a different body. This is called **overriding**: for a `Drink` object, this is the version that gets used.

## One way to use them, different behaviour

```python
items = [Drink("milk coffee", 15000, "large"), MenuItem("toast", 18000)]
for item in items:
    print(item)
```

```
milk coffee: Rp18000
toast: Rp18000
```

`Drink` has no `__str__` of its own, so the inherited `__str__` runs. Inside it, `self.selling_price()` calls the version that belongs to the object being printed. The code looping over the list needs no `if` to tell the kinds apart.

A child class whose body is only `pass` behaves exactly like its parent.
