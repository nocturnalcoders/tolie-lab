---
title: A price list with dictionaries
---
Menu prices should not be scattered in many places. We keep them in a single **dictionary**: a collection of *key* and *value* pairs.

## Creating and reading

```python
menu = {"milk coffee": 15000, "pulled tea": 12000}

print(menu["milk coffee"])   # 15000
```

The key is on the left of the colon, the value on the right. Reading a key that does not exist causes a `KeyError`.

## Checking and getting safely

```python
if "orange juice" in menu:
    print("Available")
else:
    print("Not yet")

print(menu.get("orange juice", 0))   # 0, because it is missing
```

`.get(key, fallback)` returns the fallback value if the key is missing, without an error.

## Adding and changing

```python
menu["toast"] = 18000          # add
menu["milk coffee"] = 16000    # change a price
```

## Looping over a dictionary

```python
for name, price in menu.items():
    print(name, price)
```
