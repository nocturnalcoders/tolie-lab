---
title: Nested data and .get
---
Real orders from AntarMakan are not as simple as one flat row. An order can hold several dishes, and the customer details have a section of their own:

```json
{
  "id": "AM-1021",
  "customer": {"name": "Dewi", "city": "Bandung"},
  "items": [
    {"dish": "beef rendang rice", "qty": 2, "price": 28000},
    {"dish": "sweet iced tea", "qty": 2, "price": 6000}
  ]
}
```

The value of a key may be another object (`{}`) or a list (`[]`). This is called **nested** data. The app sends it as one long line. It is spread over several lines here only to make it easy to read.

## Walking in one step at a time

After `json.loads`, an object becomes a dictionary and a list becomes a list. Fetch the value one layer at a time:

```python
order = json.loads(input())
print(order["customer"]["name"])       # Dewi
print(order["items"][0]["dish"])       # beef rendang rice
print(len(order["items"]))             # 2
```

You loop over the items with `for`, just like the lists of dictionaries you already know:

```python
for item in order["items"]:
    print(item["dish"], item["qty"] * item["price"])
```

## Keys that are sometimes missing

The app does not always send every key. An order that has no courier yet, for example, has no `delivery` section. Fetching a missing key with square brackets stops the program with a `KeyError`.

`.get` is safer, because it returns a fallback value when the key is missing:

```python
note = order.get("note", "-")
```

For nested data, use `{}` as the fallback for the first layer, so that the next `.get` can still run:

```python
delivery = order.get("delivery", {})
fee = delivery.get("fee", 0)
```

If `delivery` is missing, `fee` becomes `0` and the program keeps running.
