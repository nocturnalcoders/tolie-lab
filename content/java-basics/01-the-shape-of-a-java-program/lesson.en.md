---
title: The Shape of a Java Program
---
Mr. Bayu's Lentera Bookshop runs a few small Java programs in its back office: tracking stock, adding up sales, printing labels. Sari, a cashier who has just finished a Python course, is asked to help look after them. Her first step is not writing but **reading**. That is what this course trains.

## The smallest program

```java
public class Shop {
    public static void main(String[] args) {
        System.out.println("Lentera Bookshop");
        System.out.println("Opens at 9");
    }
}
```

The result:

```
Lentera Bookshop
Opens at 9
```

How to read it, from the outside in:

- `public class Shop { ... }`: all Java code lives inside a **class**. The class `Shop` is saved in the file `Shop.java`; the two names must match.
- `public static void main(String[] args) { ... }`: the program's **entry point**. Java always starts at `main`. Recognise its shape for now; lesson 5 explains each word.
- `System.out.println("...")` prints text and then moves to a new line. `System.out.print("...")` prints without moving to a new line.
- Text is written in **double quotes**. Single quotes are only for one character, such as `'A'`.
- Every statement ends with a **semicolon** `;`.
- Curly braces `{ }` mark where a block starts and ends. Indentation is only for tidiness, not a rule.
- Upper and lower case matter: `System` is not `system`.

## Compiled first, then run

```
javac Shop.java
java Shop
```

`javac` (the compiler) checks the whole file and produces `Shop.class`. If there is even one mistake, such as a missing semicolon, the compiler refuses and **nothing** runs. Only once it passes does `java Shop` run the program.

## Compared with Python

| Python | Java |
| --- | --- |
| `print("Hello")` | `System.out.println("Hello");` |
| blocks are marked by indentation | blocks are marked by `{ }` |
| a new line ends a statement | `;` ends a statement |
| a wrong type or a wrong name only shows up when that line runs | the compiler rejects it before the program runs |

In this course Java is not run in the browser. You practise by tracing code line by line and then answering multiple-choice questions.
