---
title: "Project: a small till"
---
Time to put everything you have learned together into a small till for Senja Coffee Shop. There is no new syntax in this lesson. What is new is how the work is shared out between several classes.

## Who looks after what

- `MenuItem` knows its own name and price.
- `Menu` stores every item and knows how to find one.
- `OrderLine` knows its subtotal.
- `Order` stores its lines, rejects a bad quantity, works out the total, and prints the receipt.

Each class is small and has one job. If the receipt is wrong, you know which class to open.

## Menu: a dictionary wrapped in a class

```python
class Menu:
    def __init__(self):
        self.items = {}

    def add(self, item):
        self.items[item.name] = item

    def find(self, name):
        key = name.strip().lower()
        if key not in self.items:
            raise ValueError(f"Not on the menu: {key}")
        return self.items[key]
```

The item's name is the key, the object is the value. `find` tidies up the cashier's typing first, so ` Milk Coffee ` is still found. If the item really is not there, `find` does not quietly return `None`. It raises a `ValueError` that names what was looked for.

## The main program becomes short

```python
order = Order("Siti")
for name, quantity in [("milk coffee", 2), ("fried rice", 1), ("toast", 1)]:
    try:
        order.add(menu.find(name), quantity)
    except ValueError as e:
        print(f"Skipped: {e}")
order.print_receipt()
```

```
Skipped: Not on the menu: fried rice
== Receipt for Siti ==
2 x milk coffee = Rp30000
1 x toast = Rp18000
Total: Rp48000
```

One `except` catches two kinds of rejection: an item that does not exist (from `Menu.find`) and a bad quantity (from `Order.add`). The main program does not need to know which rule was broken. It just prints the message and moves on to the next line.
