---
title: Getting to know JSON
---
Ms. Sari's Kitchen in Bandung sells rice boxes through the food-delivery app AntarMakan. Every incoming order is sent by the app as text in the **JSON** format. Ms. Sari wants a small program that can read it, and you are the one asked to write it.

## What JSON looks like

```json
{"id": "AM-1021", "customer": "Dewi", "dish": "beef rendang rice", "qty": 2, "price": 28000}
```

It looks like a Python dictionary: pairs of keys and values inside curly braces. The difference is that JSON is only **text**. Its keys are always wrapped in double quotes, and so is any text inside it.

## From text to a dictionary

The `json` module comes with Python. `json.loads` turns JSON text into Python data:

```python
import json

text = input()
order = json.loads(text)
print(order["customer"])
print(order["qty"] * order["price"])
```

For the text above this shows `Dewi` and then `56000`. After `json.loads`, `order` is an ordinary dictionary, so everything you already know still applies. The order of the keys in the text does not matter, because values are fetched by key name.

## Kinds of values

A number without quotes becomes a number, so you can calculate with it right away, no `int()` needed. Three special values change their spelling:

| JSON | Python |
| --- | --- |
| `true` | `True` |
| `false` | `False` |
| `null` | `None` |

```python
order = json.loads('{"paid": true, "note": null}')
if order["paid"]:
    print("Already paid")
if order["note"] is None:
    print("No note")
```

`null` means "nothing here", and you check for it with `is None`.

Watch out for numbers inside quotes: `"2"` is still text, not a number.
