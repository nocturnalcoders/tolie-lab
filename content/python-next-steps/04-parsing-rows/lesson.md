---
title: Reading rows of data
---
The till at Senja Coffee Shop can export its transactions as text, one transaction per line, with commas in between. This format is called **CSV** and is used in almost every office. Our job is to turn that raw text into records we can calculate with.

## Splitting into columns

```python
row = "08:15,milk coffee,2,15000"
columns = row.split(",")

print(columns)      # ['08:15', 'milk coffee', '2', '15000']
print(columns[1])   # milk coffee
```

Everything `split` gives back is still **text**, including `'2'` and `'15000'`. Convert with `int` before calculating:

```python
quantity = int(columns[2])
price = int(columns[3])
print(quantity * price)   # 30000
```

## Data typed by hand

Real data is rarely tidy. Spaces and capital letters can turn up anywhere:

```python
columns = " Milk Coffee , 2 ,15000".split(",")
print(columns)   # [' Milk Coffee ', ' 2 ', '15000']
```

`split` does not remove spaces. Tidy the text with `.strip()` and `.lower()`. For numbers, `int` already ignores spaces at the edges, so `int(" 2 ")` gives `2`.

## One function for one row

Wrap those steps in a function that turns one row into one record:

```python
def parse(row):
    columns = row.split(",")
    return {
        "item": columns[1].strip().lower(),
        "quantity": int(columns[2]),
        "price": int(columns[3]),
    }
```

## The header row

A CSV file usually starts with a header row such as `time,item,quantity,price`. That row is not data, so read it once and ignore it:

```python
n = int(input())
input()   # skip the header row
for _ in range(n):
    record = parse(input())
```
