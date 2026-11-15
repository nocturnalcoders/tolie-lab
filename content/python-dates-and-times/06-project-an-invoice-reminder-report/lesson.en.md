---
title: "Project: an invoice reminder report"
---
Every Friday morning Ms. Rina opens the invoice drawer and asks: which ones are overdue, which have to be paid this week, and how much money should be set aside? In this last lesson we build a report that answers all three, using everything learned so far.

## The data

Ms. Rina types one row per invoice: the supplier, the invoice date, the term in days, and the amount.

```
Gayo Coffee Co,12/02/2025,30,1250000
Makmur Bakery,24/02/2025,14,450000
```

Because it is typed by hand, some rows are broken.

## Step 1: one row becomes one record

The `parse` function turns one row into a dictionary, or `None` when the row is broken. `strptime` and `int` both raise `ValueError`, so a single `try` catches everything:

```python
from datetime import datetime, timedelta

def parse(row):
    try:
        supplier, text, term, amount = row.split(",")
        invoice = datetime.strptime(text.strip(), "%d/%m/%Y").date()
        term = int(term)
        amount = int(amount)
    except ValueError:
        return None
    ...
```

The record does not keep the invoice date but the **due date**: `invoice + timedelta(days=term)`. That is the date every later step uses.

## Step 2: the status of each invoice

"Today" is read from the first line of the input, then compared with the due date as in lesson 3:

```python
left = (inv["due"] - today).days
```

## Step 3: sort

The most urgent invoice belongs at the top. The key function returns a tuple, so invoices with the same due date are sorted by supplier name:

```python
def order(inv):
    return (inv["due"], inv["supplier"])

for inv in sorted(invoices, key=order):
    ...
```

## Step 4: the summary

While printing, collect two figures: the overdue invoices, and the money for invoices due within the next 7 days:

```python
if left < 0:
    overdue += 1
    overdue_money += inv["amount"]
elif left <= 7:
    this_week += inv["amount"]
```

The `elif` branch is only checked when `left` is not negative, so `left <= 7` means 0 to 7.
