---
title: Reading and writing dates
---
Supplier invoices write dates like `14/03/2025`, while the till writes `2025-03-14`. Before we can calculate with that text, it has to become a real date. In the other direction, a date needs to be written back in a format that is pleasant to read.

## From text to a date: strptime

```python
from datetime import datetime

text = "14/03/2025"
day = datetime.strptime(text, "%d/%m/%Y").date()
print(day)   # 2025-03-14
```

The second argument is a **pattern** that describes the shape of the text. The codes used most often:

| Code | Meaning | Example |
| --- | --- | --- |
| `%d` | day, two digits | `14` |
| `%m` | month, two digits | `03` |
| `%Y` | year, four digits | `2025` |
| `%H` | hour (00 to 23) | `08` |
| `%M` | minute | `30` |

Upper and lower case mean different things: `%m` is the month, `%M` is the minute. The characters in between (`/`, `-`, a space) must match the text exactly.

`strptime` gives a `datetime`, which is a date together with a clock time. Add `.date()` to keep only the date.

## Text that is wrong

When the text does not fit the pattern, or the date does not exist, you get a `ValueError`. Catch it with try/except as in the previous course:

```python
try:
    day = datetime.strptime("30/02/2025", "%d/%m/%Y").date()
except ValueError:
    print("Invalid date")
```

## From a date to text: strftime

The other way round, `strftime` writes a date following a pattern:

```python
from datetime import date

shift = date(2025, 3, 5)
print(shift.strftime("%d/%m/%Y"))   # 05/03/2025
print(shift.strftime("%Y-%m"))      # 2025-03
```

## Day and month names

`strftime` has codes for day names and month names, but their result depends on the language settings of the computer running the program. To get the same result everywhere, use the numeric codes only and take names from your own list:

```python
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

print(f"{DAYS[shift.weekday()]}, {shift.strftime('%d/%m/%Y')}")
# Wednesday, 05/03/2025
```
