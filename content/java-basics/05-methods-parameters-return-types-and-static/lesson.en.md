---
title: "Methods: Parameters, Return Types and static"
---
Working out a total and printing a receipt happen again and again at the till. In Java, a named piece of code you can call repeatedly is a **method** (in Python: a function).

```java
public class Cashier {
    static int totalPrice(int price, int quantity) {
        return price * quantity;
    }

    static boolean needsReorder(int stock) {
        return stock < 5;
    }

    static void printReceipt(String title, int total) {
        System.out.println(title + ": Rp" + total);
    }

    public static void main(String[] args) {
        int total = totalPrice(48000, 3);
        printReceipt("Pocket Dictionary", total);
        System.out.println(needsReorder(3));
    }
}
```

```
Pocket Dictionary: Rp144000
true
```

## Reading a method header

Take `static int totalPrice(int price, int quantity)`:

- The `int` before the name is the **return type**: the kind of value that `return` hands back.
- `totalPrice` is its name.
- `(int price, int quantity)` are the **parameters**, each written with its type.

The value after `return` must match the return type. The compiler checks this.

`void` means the method **returns nothing**. `printReceipt` only prints, so there is no `return total;` inside it, and its result cannot be stored in a variable.

## Parameters are copies

When `totalPrice(48000, 3)` is called, `price` holds a copy of `48000`. Changing a parameter of type `int`, `double` or `boolean` inside the method does **not** change the caller's variable.

## What static means

`static` means the method belongs to the **class**, not to an object, so it can be called directly without creating an object. `main` itself is `static`, which is why it can simply call `totalPrice(...)`. Methods may appear in any order inside the class: `main` could be written first.

Now the line `public static void main(String[] args)` can be read in full: open to be called from outside, belongs to the class, returns no value, is named `main`, and receives an array of text.

## Compared with Python

- `def total_price(price, quantity):` names no types. Java writes the type of every parameter and of the return value.
- A Python function without `return` quietly returns `None`. In Java you write `void`, and using its result is rejected by the compiler.
