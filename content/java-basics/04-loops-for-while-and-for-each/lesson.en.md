---
title: "Loops: for, while and for-each"
---
Every evening Mr. Bayu summarises the sales of the last four days. The data sits in an **array**, and loops do the work.

```java
public class Summary {
    public static void main(String[] args) {
        int[] sold = {4, 7, 2, 5};

        int total = 0;
        for (int i = 0; i < sold.length; i++) {
            total += sold[i];
        }
        System.out.println("Total: " + total);

        for (int count : sold) {
            if (count >= 5) {
                System.out.println("Busy day: " + count);
            }
        }

        int stock = 20;
        int days = 0;
        while (stock > 5) {
            stock -= 6;
            days++;
        }
        System.out.println(days + " days, " + stock + " left");
    }
}
```

```
Total: 18
Busy day: 7
Busy day: 5
3 days, 2 left
```

## Arrays

`int[] sold = {4, 7, 2, 5};` creates an array of four `int` values. Its length is fixed: `sold.length` (no parentheses) is `4`. Indexes start at `0`, so the last element is `sold[3]`. Reading `sold[4]` compiles, but the program stops with an `ArrayIndexOutOfBoundsException` when it runs.

## Three ways to repeat

- `for (int i = 0; i < sold.length; i++)` has three parts: the **start**, the **condition to continue**, and the **step**. `i++` means `i = i + 1`, and `total += x` means `total = total + x`. Here `i` takes the values 0, 1, 2, 3.
- `for (int count : sold)` is called for-each: "for each `count` in `sold`". You get the element itself, without an index number.
- `while (stock > 5)` repeats as long as the condition is true. The condition is checked **before** every round, so the body may never run at all.

A variable created inside a loop, such as `i` and `count`, only lives inside that loop. Outside its curly braces the compiler no longer knows it.

## Compared with Python

| Python | Java |
| --- | --- |
| `for i in range(4):` | `for (int i = 0; i < 4; i++) {` |
| `for count in sold:` | `for (int count : sold) {` |
| `len(sold)` | `sold.length` |
| `[4, 7, 2, 5]` | `{4, 7, 2, 5}` |

In Python the loop variable can still be used after the loop ends. In Java it cannot.
