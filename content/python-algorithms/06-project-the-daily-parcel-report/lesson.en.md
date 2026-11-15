---
title: "Project: the daily parcel report"
---
Every afternoon Mr. Darto needs two things: a **summary** of the parcels that came in that day, and a quick way to answer customers asking about their tracking number. You already have all the parts. Now it is a matter of putting them together.

## The summary: a single pass

The data comes in as lines of `tracking number,city,weight`. Counting parcels per city, adding up the weight and tracking the heaviest parcel can all be done in one loop:

```python
per_city = {}
total_weight = 0
for p in parcels:
    per_city[p["city"]] = per_city.get(p["city"], 0) + 1
    total_weight += p["weight"]
```

To sort the cities from the busiest, and alphabetically when the counts are equal, use `sorted` with a `key` that returns two values:

```python
def order(pair):
    city, count = pair
    return (-count, city)

for city, count in sorted(per_city.items(), key=order):
    print(city, count)
```

## Tracking: sort once, search many times

Parcels arrive in random order, but binary search needs sorted data. So sort **once** with `sorted`, then use the result for every question that day.

The search function needs to return two things: the result and the number of steps. A function may return a list, and the caller unpacks it into two variables:

```python
def find(data, wanted):
    steps = 0
    # ... binary search ...
    return [city, steps]

city, steps = find(data, 1042)
```

## A note on efficiency

Why bother sorting first? Picture 1,000 parcels and 500 questions a day.

- **One by one**: each question can take 1,000 steps, so up to 500,000 steps a day.
- **Sort, then halve**: sorting once takes about 10,000 steps, then each question takes at most 10 steps. About 15,000 in total.

The rule of thumb: work whose steps **grow along with `n`** gets heavy when it is repeated many times, while work that **halves** is hardly noticeable. If there is only one question, sorting first is actually a loss. So before choosing a method, ask: how large is the data, and how often is this job repeated?
