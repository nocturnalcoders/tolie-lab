---
title: Decisions with if, when and Ranges
---
Bersih Wangi Laundry has pricing rules: 5 kg or more gets a cheaper rate, and the express service costs more. The cashier app has to choose.

## if produces a value

`if` can be used as in other languages, with `{ }` blocks. But in Kotlin `if` is also an **expression**: it produces a value that can be stored right away.

```kotlin
fun main() {
    val weight = 5
    val rate = if (weight >= 5) 6000 else 7000
    println("Total: Rp${weight * rate}")
}
```

This program prints `Total: Rp30000`. The condition is always written in parentheses. When `if` is used as a value, the `else` is required: without it, Kotlin would not know the value when the condition is false, and the code is rejected.

## when

For many choices, Kotlin uses `when`:

```kotlin
fun main() {
    val service = "express"
    val rate = when (service) {
        "regular" -> 7000
        "express" -> 12000
        else -> 0
    }
    println(rate)
}
```

This program prints `12000`. Kotlin checks the branches from the top, runs the **one** first branch that matches, and is done. No `break` is needed. Like `if`, a `when` used as a value needs an `else`.

## Ranges

`1..4` is the range from 1 to 4, and **4 is included**. `1 until 4` stops before 4. The word `in` checks whether a value is inside a range:

```kotlin
fun main() {
    val weight = 4
    val category = when (weight) {
        in 1..4 -> "Small"
        in 5..10 -> "Medium"
        else -> "Large"
    }
    println(category)

    for (shelf in 1..3) {
        println("Shelf $shelf")
    }
}
```

This program prints `Small`, then `Shelf 1`, `Shelf 2` and `Shelf 3`, each on its own line.

## Compared with Python

- Python: `rate = 6000 if weight >= 5 else 7000`. Kotlin: `val rate = if (weight >= 5) 6000 else 7000`. Kotlin has no `? :` operator.
- `when` replaces a chain of `if` / `elif` / `else`.
- `range(1, 4)` in Python holds 1, 2, 3. In Kotlin that is `1 until 4` or `1..3`, while `1..4` holds 1, 2, 3, 4.
