---
title: "Lists of orders: filtering and totals"
---
Every night AntarMakan sends all of that day's orders at once. They arrive as a JSON list: square brackets holding many objects.

```json
[
  {"id": "AM-1021", "status": "done", "total": 68000},
  {"id": "AM-1022", "status": "cancelled", "total": 22000},
  {"id": "AM-1023", "status": "done", "total": 50000}
]
```

`json.loads` turns it into a list of dictionaries. The empty list `[]` becomes an empty list, and a loop over it simply never runs, without any error.

```python
import json

orders = json.loads(input())
print(len(orders))   # 3
```

## Filtering while adding up

A cancelled order brings in no money. So before adding up, filter with `if`:

```python
revenue = 0
done = 0
for order in orders:
    if order["status"] == "done":
        done += 1
        revenue += order["total"]
print(done, revenue)   # 2 118000
```

The pattern is always the same: set up the containers before the loop, check the condition inside it, and print the result once the loop has finished.

## Lists inside a list

When every order carries a list of `items`, use a loop inside a loop. The count per dish goes into a dictionary with the `.get(key, 0)` pattern:

```python
sold = {}
for order in orders:
    if order["status"] != "done":
        continue
    for item in order["items"]:
        dish = item["dish"]
        sold[dish] = sold.get(dish, 0) + item["qty"]
```

`continue` jumps to the next order, so cancelled orders are left out of the count.

## A fixed order

To get the same result every time, print in alphabetical order with `sorted`:

```python
for dish in sorted(sold):
    print(f"{dish}: {sold[dish]}")
```

An empty dictionary counts as false inside an `if`, so `if not sold:` means "nothing has been sold yet".
