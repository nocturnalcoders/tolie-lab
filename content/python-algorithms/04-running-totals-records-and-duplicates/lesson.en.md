---
title: Running totals, records and duplicates
---
A lot of warehouse work gets done in **a single pass** over the data, as long as we carry a small note along the way. The three patterns below come up again and again, so they are worth knowing by heart.

## Running total

The stock of boxes changes every day: up when a delivery arrives, down when boxes are used. The note is just one variable that keeps being updated:

```python
stock = 20
changes = [5, -8, 10, -3]

for c in changes:
    stock += c
    print(stock)   # 25, 17, 27, 24
```

We do not add everything up from the start each day. Yesterday's value is reused, so each piece of data is touched only once.

## Tracking a record

When was the stock at its highest? Keep the record so far, and replace it only when something beats it:

```python
numbers = [25, 17, 27, 24]

highest = numbers[0]
day = 1
for i in range(1, len(numbers)):
    if numbers[i] > highest:
        highest = numbers[i]
        day = i + 1

print(highest, day)   # 27 3
```

Two things matter. First, the starting record is taken from **the first piece of data**, not 0. If all the data is negative, a starting value of 0 is never beaten and the answer is wrong. Second, `>` (not `>=`) lets the **first** record stand when values are equal.

`max()` does give you the highest value, but with this pattern you also know **when** that record happened.

## Removing duplicates without changing the order

Parcels sometimes get scanned twice. `set()` removes duplicates, but the scan order is lost. The fix: use a set only as a memory of "already seen", and keep the result in a list.

```python
scans = ["KJ-104", "KJ-221", "KJ-104"]

seen = set()
unique = []
for tracking in scans:
    if tracking not in seen:
        seen.add(tracking)
        unique.append(tracking)

print(unique)   # ['KJ-104', 'KJ-221']
```

`not in` means "is not inside". Checking what is in a set is very fast and hardly depends on how much it holds, so the whole job is still a single pass.
