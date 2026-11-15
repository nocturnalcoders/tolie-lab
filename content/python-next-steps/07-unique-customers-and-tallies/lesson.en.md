---
title: Unique customers and tallies
---
There were 40 transactions today. Does that mean 40 people came in? Not necessarily, because a loyal customer may buy three times in a day. Ms. Rina wants to know **how many different people** there were, and who comes in most often.

## Sets: a collection with no duplicates

A **set** is like a list, but each entry is kept only once:

```python
customers = set()
customers.add("Siti")
customers.add("Budi")
customers.add("Siti")   # already there, nothing changes

print(len(customers))        # 2
print("Budi" in customers)   # True
```

An empty set is made with `set()`. A bare `{}` gives an empty dictionary, not a set.

`"Siti"` and `"siti "` count as different, so tidy the names before adding them.

## Sets have no order

You cannot rely on the order of a set, and you cannot pick entries out by position. Before printing, sort it with `sorted`, which turns it into a list:

```python
for name in sorted(customers):
    print(name)
```

The result is `Budi` then `Siti`, always in alphabetical order.

## Counting how often

A set only knows *there or not*. To know *how many times*, use a dictionary with the name as the key and the tally as the value:

```python
counts = {}
for name in ["Siti", "Budi", "Siti"]:
    counts[name] = counts.get(name, 0) + 1

print(counts)   # {'Siti': 2, 'Budi': 1}
```

`.get(name, 0)` gives back `0` for a name seen for the first time, and then one is added. This one-line pattern is used all the time for building summaries.

`sorted(counts)` gives the keys in alphabetical order:

```python
for name in sorted(counts):
    print(f"{name}: {counts[name]}")
```
