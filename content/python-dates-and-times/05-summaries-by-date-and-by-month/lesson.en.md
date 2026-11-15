---
title: Summaries by date and by month
---
Ms. Rina's sales book holds one row per till deposit: the date and the amount of money. The rows are not always in order, and one date can appear several times. Ms. Rina wants a summary by date and by month, starting from the earliest.

## Do not sort date text

Text is sorted character by character from the left, so dates written as `day/month/year` come out in the wrong order:

```python
print(sorted(["05/02/2025", "20/01/2025"]))
# ['05/02/2025', '20/01/2025']   February before January!
```

Turn them into a `date` first. Real dates are sorted by the calendar.

## A date as a dictionary key

The counting pattern with `.get` from the previous course still applies. The key is now a `date`:

```python
from datetime import datetime

rows = ["14/03/2025,45000", "13/03/2025,30000", "14/03/2025,15000"]

sales = {}
for row in rows:
    text, amount = row.split(",")
    day = datetime.strptime(text, "%d/%m/%Y").date()
    sales[day] = sales.get(day, 0) + int(amount)
```

`sorted(sales)` sorts the keys, from the earliest date:

```python
for day in sorted(sales):
    print(day.strftime("%d/%m/%Y"), sales[day])
# 13/03/2025 30000
# 14/03/2025 60000
```

## Grouping by month

For a monthly summary, the key only needs the year and the month. `strftime("%Y-%m")` makes text such as `2025-03`:

```python
month = day.strftime("%Y-%m")
by_month[month] = by_month.get(month, 0) + int(amount)
```

Text written as `year-month` is safe to sort, because the biggest part (the year) is on the left and the month always has two digits: `2024-12` comes before `2025-01`.

## Sorting records by date

When the data is a list of dictionaries, give `sorted` a key function that returns the date:

```python
from datetime import date

def by_date(record):
    return record["date"]

deposits = [
    {"date": date(2025, 1, 1), "amount": 120000},
    {"date": date(2024, 12, 31), "amount": 250000},
]
for d in sorted(deposits, key=by_date):
    print(d["date"], d["amount"])
# 2024-12-31 250000
# 2025-01-01 120000
```
