---
title: Binary search on sorted shelves
---
Mr. Darto has tidied the warehouse: parcels are now arranged **in order of tracking number**, smallest first. With sorted shelves we can search the way you open a dictionary: look at the middle, then throw away the half that cannot hold the answer.

## Halving

```python
tracking = [105, 118, 124, 131, 140, 152, 167]
wanted = 152

left = 0
right = len(tracking) - 1
position = 0
steps = 0
while left <= right:
    middle = (left + right) // 2
    steps += 1
    if tracking[middle] == wanted:
        position = middle + 1
        break
    elif tracking[middle] < wanted:
        left = middle + 1
    else:
        right = middle - 1

print(position, steps)   # 6 2
```

`left` and `right` are the edges of the area that can still hold the parcel. `while` repeats as long as its condition is true, here as long as that area is not used up.

Follow it through: the first middle is index 3, which holds `131`. That is smaller than `152`, so indexes 0 to 3 are thrown away with `left = middle + 1`. The next middle is index 5, which holds `152`. Found in 2 steps, where linear search needs 6.

Once `left` has passed `right`, the area is empty and the parcel really is not there.

## Why it is so much faster

Every step throws away **half** of the remaining shelves. How many times can a number be halved before nothing is left?

```python
n = 1000
steps = 0
while n > 0:
    n = n // 2
    steps += 1
print(steps)   # 10
```

For 1,000 parcels it takes at most 10 steps. For 1,000,000 parcels only 20. Linear search grows along with `n`, while binary search gains just one step each time the number of parcels **doubles**.

## The condition

Binary search is only correct when the data is **sorted**. On shuffled shelves, looking at the middle tells you nothing about the left and right halves, so nothing may be thrown away.
