---
title: Getting to know date
---
Ms. Rina pins the shift schedule to the wall of Senja Coffee Shop and keeps supplier invoices in a drawer. Both are full of dates. If a date is only stored as text such as `"14/03/2025"`, Python does not know which day of the week it is or which date comes first. That is why Python has a special type: `date`.

## Creating a date

```python
from datetime import date

due = date(2025, 3, 14)
print(due)   # 2025-03-14
```

The order is always **year, month, day**. When printed, a date appears as `year-month-day` with a two-digit month and day.

## Getting the parts

```python
print(due.year)    # 2025
print(due.month)   # 3
print(due.day)     # 14
```

All three are ordinary numbers, so you can calculate with them or compare them.

## A date from input

`input()` always gives text. Convert it to numbers with `int` first:

```python
year = int(input())
month = int(input())
day = int(input())
shift = date(year, month, day)
```

Python refuses dates that do not exist. `date(2025, 2, 30)` stops with a `ValueError`, while `date(2024, 2, 29)` is accepted because 2024 is a leap year.

## Which day is it?

`.weekday()` returns a number: **0 for Monday** up to 6 for Sunday.

```python
print(date(2025, 3, 14).weekday())   # 4
```

That number works well as the index of your own list of day names:

```python
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

shift = date(2025, 3, 14)
print(DAYS[shift.weekday()])   # Friday
```

With your own list, day names always appear in the language you want, on whichever computer the program runs.

## Comparing dates

Dates can be compared like numbers. The earlier one counts as smaller:

```python
print(date(2024, 12, 31) < date(2025, 1, 1))   # True
```

## An important note

In this course "today" is always read from the input, never taken from the computer's clock. That way a program gives the same result whenever it runs, and it is easy to test.
