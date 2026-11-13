---
title: Cleaning customer data
---
Senja Coffee Shop's customer list is a mess: some names are typed in all capitals, some have extra spaces. The data needs tidying before it can be used. Work like this shows up in offices all the time.

## String methods

Text has many "methods", commands written after a dot:

| Method | Result for `"  siti aMINAH "` |
| --- | --- |
| `.strip()` | `"siti aMINAH"` (spaces at the ends removed) |
| `.lower()` | `"  siti aminah "` |
| `.upper()` | `"  SITI AMINAH "` |
| `.title()` | `"  Siti Aminah "` |

Methods can be chained from left to right:

```python
name = "  siti aMINAH "
print(name.strip().title())
```

The result is `Siti Aminah`.

## Splitting text

`.split("@")` splits text at a certain character and gives a **list**:

```python
email = "budi@gmail.com"
parts = email.split("@")
print(parts)      # ['budi', 'gmail.com']
print(parts[1])   # gmail.com
```

Items in a list are read by their position number, which starts at `0`.
