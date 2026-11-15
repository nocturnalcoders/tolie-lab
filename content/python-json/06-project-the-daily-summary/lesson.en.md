---
title: "Project: the daily summary"
---
Time to bring it all together. Every night AntarMakan sends one line of JSON holding all of that day's orders. Ms. Sari wants two things: a short summary she can read on her phone, and the same summary as JSON for her bookkeeping app.

```json
[
  {"id": "AM-1021", "customer": "Dewi", "status": "done",
   "items": [{"dish": "beef rendang rice", "qty": 2, "price": 28000}]},
  {"id": "AM-1022", "customer": "Budi", "status": "cancelled",
   "items": [{"dish": "smashed chicken", "qty": 3, "price": 22000}]}
]
```

## The plan

1. **Read** the input line with `json.loads`.
2. **Collect** the numbers from the done orders: how many orders, the revenue, the portions sold per dish, and the customers' names.
3. **Print** the result, as text or with `json.dumps`.

## A small function for one order

The total of one order is needed in many places, so make it a function. Some orders arrive without the `items` key, so use `.get` with an empty list as the fallback:

```python
def order_total(order):
    total = 0
    for item in order.get("items", []):
        total += item["qty"] * item["price"]
    return total
```

An order without items is worth `0` and raises no error.

## Unique customers

A set keeps each name only once. But `json.dumps` does not know sets, and the order of their contents is not fixed. `sorted` solves both, because it returns a sorted list:

```python
customers = set()
customers.add("Dewi")
customers.add("André")
customers.add("Dewi")
print(sorted(customers))   # ['André', 'Dewi']
```

## Building the summary

Gather every result in one dictionary, then print it with the settings from lesson 4:

```python
summary = {"revenue": revenue, "customers": sorted(customers), "sold": sold}
print(json.dumps(summary, indent=2, sort_keys=True, ensure_ascii=False))
```

`sort_keys=True` also sorts the keys inside `sold`, so the dish names come out in alphabetical order as well.

You can now take in data from an app, summarise it and send it on again, just like the programs that exchange data every day.
