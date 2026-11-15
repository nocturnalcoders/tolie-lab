---
title: "Project: the daily report"
---
Time to put it all together. Every night the till produces raw rows in the format `customer,item,quantity`, and Ms. Rina wants one short report: how many transactions were valid, what the revenue was, how many customers came in, and which item sold best.

## The plan

A big program is easier to write when it is broken into small steps:

1. **Parse** each row into a record, or mark it as broken.
2. **Collect** the numbers from the valid records.
3. **Sort**, then **print** the result.

The price is not in the data rows. It comes from the price list:

```python
PRICES = {"milk coffee": 15000, "pulled tea": 12000, "toast": 18000, "orange juice": 10000}
```

A name in all capitals is the custom for fixed data that the whole program uses.

## None as a sign for "nothing here"

The parsing function returns a dictionary for a valid row. For a broken row it returns `None`, and the caller checks for that with `is None`:

```python
record = parse(row)
if record is None:
    broken += 1
else:
    valid += 1
```

A row is broken if it does not have three columns, its quantity is not a number, its quantity is 0 or less, or its item is not in `PRICES`.

## Sorting by two rules

The revenue ranking goes from the largest down. When two are equal, they go in alphabetical order so the result is always the same. To do that, `key` returns **two values** in brackets:

```python
def ranking(pair):
    name, value = pair
    return (-value, name)

revenue = {"pulled tea": 60000, "toast": 90000, "milk coffee": 60000}
for name, value in sorted(revenue.items(), key=ranking):
    print(name, value)
```

Python compares the first value first, and only looks at the second when the first ones are equal. The minus sign turns the largest number into the smallest, so it comes out on top. The result is `toast`, `milk coffee`, then `pulled tea`.

After this lesson you can turn raw data into a report, a job done with Python every day in a great many offices.
