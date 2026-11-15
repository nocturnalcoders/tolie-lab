---
title: The receipt
---
Every customer wants a receipt. We need to combine text and numbers into one tidy sentence.

## Data types

| Type | Example | Used for |
| --- | --- | --- |
| `str` | `"Milk Coffee"` | text |
| `int` | `15000` | whole numbers |
| `float` | `4.5` | decimal numbers |

Ask Python for the type with `type`:

```python
print(type("Coffee"))   # <class 'str'>
print(type(15000))      # <class 'int'>
```

## f-strings

Start the text with `f` and put values inside curly braces:

```python
name = "Budi"
quantity = 2
print(f"{name} bought {quantity} cups")
```

The result:

```
Budi bought 2 cups
```

You can even calculate inside the braces, for example `{price * quantity}`.

## The receipt

The receipt we want looks like this:

```
Receipt for Budi
2 x Milk Coffee @ Rp15000
Total: Rp30000
```
