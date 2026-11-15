---
title: "Classes and Objects: Books on the Shelf"
---
So far a book's title, price and stock have lived in separate variables. A class lets Mr. Bayu combine them into one new kind of data: `Book`.

```java
public class Book {
    String title;
    int price;
    int stock;

    Book(String title, int price, int stock) {
        this.title = title;
        this.price = price;
        this.stock = stock;
    }

    void sell(int quantity) {
        stock -= quantity;
    }

    int stockValue() {
        return price * stock;
    }
}
```

```java
public class Bookshop {
    public static void main(String[] args) {
        Book dictionary = new Book("Pocket Dictionary", 50000, 10);
        Book atlas = new Book("World Atlas", 120000, 4);

        dictionary.sell(2);
        System.out.println(dictionary.title + ": " + dictionary.stock);
        System.out.println(atlas.title + ": " + atlas.stock);
        System.out.println(dictionary.stockValue());
    }
}
```

```
Pocket Dictionary: 8
World Atlas: 4
400000
```

## The parts of a class

- **Fields** (`title`, `price`, `stock`): the data every book has.
- The **constructor** `Book(...)`: it has the same name as the class and **no return type**, not even `void`. It runs when an object is created, to fill in the fields.
- `this.price = price;`: `this.price` is this object's field, while `price` on the right is the parameter. Without `this`, `price = price;` only assigns the parameter to itself, and the field stays `0`.
- The **methods** `sell` and `stockValue` are not `static`: they work on the data of one particular object.

## A class is the mould, an object is the thing

`new Book("Pocket Dictionary", 50000, 10)` creates one **object** from the `Book` mould. `dictionary` and `atlas` are two objects, each with its own fields: selling dictionaries does not change the atlas stock. Fields and methods are reached with a dot: `dictionary.stock`, `dictionary.sell(2)`.

A variable of a class type holds a **reference** to an object. `Book pick = dictionary;` does not copy the book; `pick` and `dictionary` point to the same object.

## Compared with Python

- `def __init__(self, title, price, stock):` becomes the constructor `Book(String title, int price, int stock)`.
- `self.stock` becomes `this.stock`, and `this` is not written in the parameter list.
- `Book("Pocket Dictionary", 50000, 10)` becomes `new Book("Pocket Dictionary", 50000, 10)`.
