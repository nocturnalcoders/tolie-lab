---
title: Daily summary with loops
---
Every night, Ms. Rina writes down the day's sales. Adding them up one by one is tiring, and repeating things is exactly what computers are best at.

## for and range

`for` repeats a block of code. `range(n)` produces the numbers `0` up to `n - 1`:

```python
for i in range(3):
    print(i)
```

The result:

```
0
1
2
```

When the counter is not used, the habit is to name the variable `_`: `for _ in range(3):`.

## Collecting a total

Prepare a starting variable, then add to it in every round:

```python
total = 0
for _ in range(3):
    total += 5
print(total)
```

`total += 5` means `total = total + 5`. The result is `15`.

## Reading many lines

A common pattern: the first line holds the number of data items `n`, and the next `n` lines hold the data.

```python
n = int(input())
total = 0
for _ in range(n):
    total += int(input())
print(total)
```
