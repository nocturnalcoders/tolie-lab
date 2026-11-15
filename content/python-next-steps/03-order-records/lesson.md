---
title: Order records
---
One order carries several facts at once: the item name, the quantity and the price. Kept in three separate variables, the data gets mixed up easily. It is tidier to make each order one **dictionary**, and to collect all the orders in one **list**.

## One order, one dictionary

```python
order = {"name": "milk coffee", "quantity": 2, "price": 15000}

print(order["name"])                      # milk coffee
print(order["quantity"] * order["price"]) # 30000
```

The keys are the same for every order, only the values differ. A dictionary like this is often called a **record**.

## Many orders, one list

Start with an empty list, then add records one at a time with `.append`:

```python
orders = []
orders.append({"name": "milk coffee", "quantity": 2, "price": 15000})
orders.append({"name": "toast", "quantity": 1, "price": 18000})

print(len(orders))         # 2
print(orders[0]["name"])   # milk coffee
```

`orders[0]` picks the first record, then `["name"]` picks a value out of it.

## Looping over every record

```python
total = 0
for o in orders:
    total += o["quantity"] * o["price"]
print(total)   # 48000
```

On each pass, `o` is one whole dictionary.

## Picking some of them

Combine `for` with `if` to take only the records that meet a condition:

```python
for o in orders:
    if o["quantity"] >= 2:
        print(o["name"])   # milk coffee
```
