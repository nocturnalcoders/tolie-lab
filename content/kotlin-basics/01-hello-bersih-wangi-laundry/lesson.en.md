---
title: Hello, Bersih Wangi Laundry
---
Mrs. Laras runs a small pay-by-the-kilo laundry, **Bersih Wangi Laundry**. Until now every receipt has been written by hand. Her nephew Dimas has started building an Android cashier app in **Kotlin**, and you are invited to read his code with him.

This course trains you to **read** Kotlin. The code is not run in the browser: you trace it line by line and then answer questions. If you want to try it yourself, paste the code into play.kotlinlang.org.

## The first program

```kotlin
fun main() {
    println("Welcome to Bersih Wangi Laundry")
}
```

Every Kotlin program starts at the `main` function. `fun` means function, its body sits between `{ }`, and `println` prints one line. Indentation is only there for tidiness; the curly braces decide what belongs to the function.

## val and var

```kotlin
fun main() {
    val ratePerKg = 7000
    var queue = 3
    queue = queue + 1
    println(queue)
}
```

This program prints `4`.

- `val` is a fixed value. Once it has a value, it cannot be given another one. The line `ratePerKg = 8000` would be rejected before the program even runs.
- `var` is a variable that may be reassigned.

Kotlin programmers use `val` whenever they can, and `var` only when the value really has to change. That makes code easier to read: when you see `val`, you know the value stays put.

## String templates

```kotlin
fun main() {
    val name = "Mrs. Wati"
    val weight = 3
    val rate = 7000
    println("Customer: $name")
    println("Total: Rp${weight * rate}")
}
```

The result:

```
Customer: Mrs. Wati
Total: Rp21000
```

`$name` is replaced by the variable's value. For a calculation, use `${ }`. Without the curly braces, only the name right after the `$` is replaced. Text always uses double quotes; single quotes are only for one character, like `'A'`.

## Compared with Python

| Python | Kotlin |
| --- | --- |
| `print("Hello")` | `println("Hello")` |
| `queue = 3` | `var queue = 3` |
| `f"Total: {total}"` | `"Total: $total"` |
| blocks marked by indentation | blocks marked by `{ }` |

In Python every variable can be reassigned. In Kotlin you choose: `val` or `var`.
