---
title: Opening hours and shift length
---
A date alone is not enough for a shift schedule. Siti starts at 14:30 and leaves at 22:15, and the shop opens at 07:00. For that there are two more types: `datetime` (a date with a clock time) and `time` (a clock time only).

## datetime: a date with a time

```python
from datetime import datetime

start = datetime(2025, 3, 14, 14, 30)
print(start)          # 2025-03-14 14:30:00
print(start.hour)     # 14
print(start.minute)   # 30
```

From text, use `strptime` with the codes `%H` and `%M`:

```python
start = datetime.strptime("2025-03-14 14:30", "%Y-%m-%d %H:%M")
```

A `datetime` can be split into its two parts, and it still has `.weekday()`:

```python
print(start.date())   # 2025-03-14
print(start.time())   # 14:30:00
```

## time: the clock only

The shop's opening hours are the same every day, so no date is needed:

```python
from datetime import time

opens = time(7, 0)
closes = time(21, 0)
now = start.time()

print(opens <= now < closes)       # True
print(closes.strftime("%H:%M"))    # 21:00
```

Times can be compared like numbers. Notice `< closes`: at exactly 21:00 the shop is already closed.

## Shift length

A `datetime` minus a `datetime` gives a `timedelta`, just as with dates:

```python
start = datetime(2025, 3, 14, 14, 30)
end = datetime(2025, 3, 14, 22, 15)

length = end - start
minutes = int(length.total_seconds()) // 60
print(minutes)   # 465
```

`.total_seconds()` gives the whole span in seconds. Split the minutes into hours and the rest with `//` and `%`:

```python
print(f"{minutes // 60} h {minutes % 60} min")   # 7 h 45 min
```

Because the date is part of the calculation, a night shift that passes midnight still comes out right. From 31 December at 20:00 to 1 January at 02:30 is 6 h 30 min.

## Adding hours

`timedelta` also accepts `hours` and `minutes`:

```python
from datetime import timedelta

finish = start + timedelta(hours=8)
print(finish)   # 2025-03-14 22:30:00
```
