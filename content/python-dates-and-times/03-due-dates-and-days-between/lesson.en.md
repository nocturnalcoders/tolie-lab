---
title: Due dates and days between
---
The coffee supplier allows 30 days to pay each invoice. When is an invoice dated 20 January due? Counting on a calendar goes wrong easily, because months differ in length and there are leap years. Python does the counting with `timedelta`.

## timedelta: a span of time

A `date` is one point on the calendar. A `timedelta` is the **distance** between two points.

```python
from datetime import date, timedelta

invoice = date(2025, 1, 20)
due = invoice + timedelta(days=30)
print(due)   # 2025-02-19
```

Python takes care of the change of month and year:

```python
print(date(2024, 12, 20) + timedelta(days=14))   # 2025-01-03
print(date(2024, 2, 28) + timedelta(days=1))     # 2024-02-29
```

Going backwards works too, for example for a reminder three days before the due date:

```python
reminder = due - timedelta(days=3)
print(reminder)   # 2025-02-16
```

For counting in weeks there is `timedelta(weeks=2)`, the same as 14 days.

## The difference between two dates

A date minus a date gives a `timedelta`. The number of days is in `.days`:

```python
today = date(2025, 3, 14)
due = date(2025, 3, 10)

gap = today - due
print(gap.days)   # 4
```

The order of the subtraction decides the sign. Turn it around and the result is negative:

```python
print((due - today).days)   # -4
```

## Overdue or not yet?

With `left = (due - today).days` there are three cases:

```python
if left < 0:
    print(f"Overdue by {-left} days")
elif left == 0:
    print("Due today")
else:
    print(f"{left} days left")
```

`-left` flips the sign, so `-4` is shown as `4`.

## What does not work

Two dates cannot be added, because "14 March plus 10 March" has no meaning. Only these make sense:

- date ± span → date
- date − date → span
