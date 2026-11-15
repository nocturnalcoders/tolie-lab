---
title: Building JSON with json.dumps
---
So far Ms. Sari's Kitchen has only received JSON. Now Ms. Sari's bookkeeping app wants data sent back, also as JSON. The opposite direction of `json.loads` is `json.dumps`: Python data becomes JSON text.

## A plain print is not JSON

```python
import json

order = {"customer": "Dewi", "paid": True, "note": None}
print(order)
print(json.dumps(order))
```

The result:

```
{'customer': 'Dewi', 'paid': True, 'note': None}
{"customer": "Dewi", "paid": true, "note": null}
```

The first line is Python's own notation: single quotes, `True`, `None`. Other apps cannot read it. The second line is valid JSON.

## A fixed key order

Two programs can build the same dictionary with its keys in a different order. `sort_keys=True` sorts the keys alphabetically, so the result is always the same:

```python
print(json.dumps({"total": 56000, "id": "AM-1021"}, sort_keys=True))
```

```json
{"id": "AM-1021", "total": 56000}
```

## Accented letters

By default, letters outside ASCII are written as codes: `André` becomes `"André"`. Add `ensure_ascii=False` so names show up as they are.

## Tidy or compact

`indent=2` puts every key on its own line, which is easy for people to read:

```python
data = {"id": "AM-1021", "dishes": ["beef rendang rice", "sweet iced tea"]}
print(json.dumps(data, indent=2, sort_keys=True))
```

```json
{
  "dishes": [
    "beef rendang rice",
    "sweet iced tea"
  ],
  "id": "AM-1021"
}
```

The other way round, `separators=(",", ":")` drops every space to save room: `{"id":"AM-1021","total":56000}`.

## Basic kinds of data only

`json.dumps` accepts dictionaries, lists, text, numbers, `True`, `False` and `None`. A number read with `input()` is still text, so convert it with `int()` first. Otherwise you get `"2"`, not `2`.
