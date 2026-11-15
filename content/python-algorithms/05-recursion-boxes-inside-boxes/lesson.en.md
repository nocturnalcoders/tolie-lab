---
title: "Recursion: boxes inside boxes"
---
Some problems contain **a smaller version of themselves**. For problems like that, a function may call itself. That is **recursion**.

## How many delivery orders?

A courier carries 3 parcels. In how many orders can they be delivered? The first parcel can be picked in 3 ways, and after that the same problem is left for 2 parcels. So:

`orders(3) = 3 × orders(2)`, `orders(2) = 2 × orders(1)`, and so on.

```python
def orders(n):
    if n <= 1:
        return 1
    return n * orders(n - 1)

print(orders(3))   # 6
```

Every recursive function has two parts:

- **The base case**: the smallest problem, whose answer is known straight away. One parcel (or no parcel) has just 1 order.
- **The recursive step**: calling itself with a **smaller** problem, here `n - 1`.

Without a base case, the function keeps calling itself until Python stops it with a `RecursionError`.

## Nested boxes

Recursion is most useful when the data itself is nested. In the warehouse, a box can hold loose items and also **other boxes**, which may hold more boxes. We do not know how deep the nesting goes, so an ordinary loop is hard to use.

```python
contents = {
    "A": ["3", "B"],
    "B": ["2", "C"],
    "C": ["1"],
}

def count(name):
    total = 0
    for thing in contents[name]:
        if thing.isdigit():
            total += int(thing)
        else:
            total += count(thing)
    return total

print(count("A"))   # 6
```

A number means that many loose items, while any other text is the name of a box inside. `.isdigit()` is `True` when a text holds only digits.

Read it like this: "the number of items in a box is its loose items plus the number of items in every box inside it." The base case is not written as a special `if`: a box that holds no other box does not call `count` again, and that is where the recursion stops.
