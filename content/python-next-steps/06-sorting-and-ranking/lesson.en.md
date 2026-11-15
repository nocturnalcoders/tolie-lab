---
title: Sorting and ranking
---
"Which item sold best this week?" To answer Ms. Rina, the data has to be **sorted** first. After that it is just a matter of taking the top few.

## sorted

`sorted` gives back a **new** list in order. The original list does not change:

```python
prices = [15000, 10000, 18000]

print(sorted(prices))                 # [10000, 15000, 18000]
print(sorted(prices, reverse=True))   # [18000, 15000, 10000]
print(prices)                         # [15000, 10000, 18000]
```

Text is sorted alphabetically. `reverse=True` flips the order to largest first.

## Sorting records with key

Python does not know how to compare two dictionaries. Tell it through `key`: a function that takes the value to compare out of one record.

```python
def get_quantity(s):
    return s["quantity"]

sales = [
    {"name": "milk coffee", "quantity": 10},
    {"name": "toast", "quantity": 12},
    {"name": "pulled tea", "quantity": 7},
]
ranked = sorted(sales, key=get_quantity, reverse=True)
print(ranked[0]["name"])   # toast
```

Notice that `key=get_quantity` is written **without brackets**: we hand over the function, we do not call it. For a function this short there is also the shorthand `key=lambda s: s["quantity"]`, which means the same thing.

When two values are equal, `sorted` keeps them in their original order, also when `reverse=True` is used.

## Taking the top few

`[:3]` cuts a list down to at most its first three entries. If there are fewer than three, you get all of them with no error:

```python
top_three = ranked[:3]
```

## Rank numbers

`enumerate(list, 1)` numbers each entry, starting from 1:

```python
for number, s in enumerate(ranked, 1):
    print(f"{number}. {s['name']}")
```

The result:

```
1. toast
2. milk coffee
3. pulled tea
```
