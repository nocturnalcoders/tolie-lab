---
title: Classes and objects
---
In the previous course one menu item was kept as a dictionary: `{"name": "milk coffee", "price": 15000}`. That works, but nothing guarantees every dictionary has the same keys. A typo like `"prcie"` only shows up when the program stops halfway. A **class** gives every menu item a fixed shape.

## A class is a mould

```python
class MenuItem:
    def __init__(self, name, price):
        self.name = name
        self.price = price
```

A class is only a mould: no menu item exists yet. Class names are usually written with a capital letter at the start of each word.

## Objects are made from the mould

```python
coffee = MenuItem("milk coffee", 15000)
tea = MenuItem("pulled tea", 12000)

print(coffee.name)   # milk coffee
print(tea.price)     # 12000
```

Calling the class name like a function creates one **object**. At that moment Python runs `__init__` for you (two underscores in front and two behind). `self` is the object being created, so you only pass `name` and `price`.

The line `self.name = name` stores a value inside the object. A value attached to an object is called an **attribute**, and you read it with a dot: `coffee.name`.

## Every object has its own data

```python
coffee.price = 16000

print(coffee.price)  # 16000
print(tea.price)     # 12000
```

`coffee` and `tea` come from the same mould, but changing one does not touch the other.

## Objects in a list

Objects can be collected in a list, just like dictionaries:

```python
items = [coffee, tea]
for m in items:
    print(f"{m.name} - Rp{m.price}")
```

The only difference is how you reach the contents: `m.name`, not `m["name"]`. If you mistype an attribute name, Python tells you straight away with an `AttributeError`.
