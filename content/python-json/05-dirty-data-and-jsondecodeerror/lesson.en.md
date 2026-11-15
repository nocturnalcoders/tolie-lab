---
title: Dirty data and JSONDecodeError
---
One night the signal in the kitchen was poor, and the data from AntarMakan arrived in a mess: one line cut short, one order without a price, another with its quantity written as text. A good program does not stop because of one broken line.

## Text that is not JSON

```python
import json

json.loads('{"id": "AM-1022", "total": 22000')
```

The closing curly brace is missing, so Python stops with `json.JSONDecodeError`. The same happens with single quotes (`{'id': 'AM-1023'}`) and an extra comma at the end (`{"total": 5000,}`). Catch it with `try` and `except`:

```python
try:
    data = json.loads(text)
except json.JSONDecodeError:
    print("not JSON")
```

## Valid JSON, but not an object

`[1, 2, 3]` and `"AM-1040"` are valid JSON, only the result is a list and a piece of text, not a dictionary. `isinstance` checks what kind of value you have:

```python
if not isinstance(data, dict):
    print("not an object")
```

## Keys that must be there

In lesson 2, `.get` supplied a fallback value. For a price, though, no fallback makes sense. It is better to reject the order. Check with `in`:

```python
if "price" not in data:
    print("missing key")
```

## The wrong type

Sometimes the app sends `"qty": "3"`, a number inside quotes. `int()` fixes that. But `int("two")` raises a `ValueError`, and `int(None)` (from `null`) raises a `TypeError`. One `except` can catch both, with the error names written inside parentheses:

```python
try:
    qty = int(data["qty"])
except (ValueError, TypeError):
    print("bad number")
```

A number that converts fine still needs a check with `if`. A quantity of `0` is a valid number, but not an order that makes sense.

## The order of the checks

Check from the outside in: is the text JSON at all, then its shape, then its keys, and only then its values. Inside a function, every failed check does a `return` straight away, so the next step only runs for data that has passed so far.
