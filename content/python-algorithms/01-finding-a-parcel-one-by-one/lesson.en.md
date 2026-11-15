---
title: Finding a parcel one by one
---
Welcome to **Kilat Jaya Express**, a small shipping counter owned by Mr. Darto. Every day dozens of parcels pile up on the warehouse shelves, and customers come by asking, "Has my parcel arrived?" In this course you teach the computer to find, sort and count parcels. A step-by-step way of working like that is called an **algorithm**.

## Linear search

The simplest way: check the shelves from the first one, one by one, until the tracking number matches.

```python
shelves = ["KJ-104", "KJ-221", "KJ-087", "KJ-150"]
wanted = "KJ-087"

position = 0
for i in range(len(shelves)):
    if shelves[i] == wanted:
        position = i + 1
        break

print(position)   # 3
```

`range(len(shelves))` gives the indexes 0 to 3. Shelves in the warehouse are numbered from 1, which is why we use `i + 1`. Starting with `position = 0` means "not found yet".

`break` stops the loop right there. Once the parcel is found, there is no point checking the rest of the shelves.

## Counting steps

How much work is this? Just count how many times we compare:

```python
steps = 0
for i in range(len(shelves)):
    steps += 1
    if shelves[i] == wanted:
        break
```

If the parcel is on shelf 3, it takes 3 steps. If the parcel is not there, **every** shelf gets checked. So for `n` parcels, the luckiest case is 1 step and the unluckiest is `n` steps. With 1,000 parcels, a single search can take 1,000 steps.

## Collecting everything that matches

When there can be more than one match, for example every parcel going to Bandung, do not use `break`. Check all the way to the end and collect the shelf numbers in a list.

To print a list of texts on one line, use `join`:

```python
numbers = ["1", "3", "5"]
print(" ".join(numbers))   # 1 3 5
```

`join` only accepts text, so convert numbers with `str()` before putting them in the list.
