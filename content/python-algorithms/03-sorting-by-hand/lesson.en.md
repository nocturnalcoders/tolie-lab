---
title: Sorting by hand
---
The courier truck has to be loaded starting with the **lightest** parcel, so heavy ones do not crush light ones. You already know `sorted()`, but what does it actually do? Let us sort the way the warehouse staff do every day.

## Selection sort

The idea: find the lightest parcel and put it at the front. Then find the lightest of **the rest** and put it second. Repeat until done.

```python
weights = [5, 2, 8, 1]
n = len(weights)

for i in range(n - 1):
    smallest = i
    for j in range(i + 1, n):
        if weights[j] < weights[smallest]:
            smallest = j
    weights[i], weights[smallest] = weights[smallest], weights[i]
    print(weights)
```

The result of each round:

```
[1, 2, 8, 5]
[1, 2, 8, 5]
[1, 2, 5, 8]
```

`smallest` keeps the **index** of the lightest parcel found so far. The inner loop only checks the part that is not tidy yet, starting from `i + 1`.

The line `a, b = b, a` **swaps** two values in one go. `n - 1` rounds are enough, because once everything else is in place, the last parcel must be too.

## How many comparisons?

For 4 parcels: the first round compares 3 times, then 2, then 1. That is 6 in total. For 1,000 parcels it is almost 500,000 comparisons. When the number of parcels doubles, the work becomes about **four times** as much. This method is easy to understand, but slow for large data.

## Checking whether it is already sorted

Checking is far lighter than sorting: just compare each parcel with its right-hand neighbour, `n - 1` comparisons.

```python
for i in range(n - 1):
    if weights[i] > weights[i + 1]:
        print("wrong at index", i)
```

## And sorted()?

`sorted()` does the same job with a much smarter algorithm: for 1,000 parcels it needs only about 10,000 comparisons. In real work, **use `sorted()`**. Sorting by hand is useful for understanding what happens underneath, and why sorting is never free.
