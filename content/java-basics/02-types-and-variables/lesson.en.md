---
title: Types and Variables
---
In Python, Sari simply writes `stock = 12`. In Java, every variable must state its **type** when it is created, and that type can never change.

```java
public class BookData {
    public static void main(String[] args) {
        String title = "Pocket Dictionary";
        int stock = 12;
        double price = 48500.5;
        boolean available = true;

        stock = stock - 2;
        System.out.println(title + ", stock " + stock);
        System.out.println(price);
        System.out.println(available);
    }
}
```

```
Pocket Dictionary, stock 10
48500.5
true
```

| Type | Holds | Example |
| --- | --- | --- |
| `int` | whole numbers | `12` |
| `double` | numbers with a fraction | `48500.5` |
| `boolean` | `true` or `false` (lowercase) | `true` |
| `String` | text (capital S) | `"Pocket Dictionary"` |

The type is written only once. After `int stock = 12;`, you just write `stock = 10;`. The line `stock = "plenty";` is rejected by the compiler because `stock` may only hold an `int`.

A whole number may go into a `double` (`double price = 85000;`), but not the other way round: `int x = 2.5;` is rejected. If you really mean it, write `(int) 2.5`, and the fraction is thrown away, giving `2`.

## Integer division

```java
System.out.println(17 / 5);            // 3
System.out.println(17 % 5);            // 2
System.out.println(17 / 5.0);          // 3.4
System.out.println((double) 17 / 5);   // 3.4
```

An `int` divided by an `int` gives an `int`: the fraction is **dropped**, not rounded. `%` gives the remainder. As soon as one side is a `double`, the result is a `double`.

## The + sign on Strings

```java
int stock = 4;
System.out.println("Stock: " + stock + 1);     // Stock: 41
System.out.println("Stock: " + (stock + 1));   // Stock: 5
System.out.println(stock + 1 + " books");      // 5 books
```

`+` is worked out from left to right. While both sides are numbers, it adds. As soon as one side is a `String`, it **joins** text.

## Compared with Python

- `17 / 5` gives `3.4` in Python; in Java it gives `3`, much like `17 // 5`.
- `"Stock: " + 4` is an error in Python; in Java the number is turned into text automatically.
- `True` and `False` in Python, `true` and `false` in Java.
