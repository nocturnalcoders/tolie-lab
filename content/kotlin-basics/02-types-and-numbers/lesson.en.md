---
title: Types and Numbers
---
Mrs. Laras's scale shows 2.5 kg, but a receipt only knows whole rupiah. In Kotlin, differences like this are governed by **types**.

## The four types you will see most

```kotlin
fun main() {
    val queue = 3                // Int: a whole number
    val weight = 2.5             // Double: a decimal number
    val paid = false             // Boolean: true or false
    val name = "Mrs. Wati"       // String: text
    val rate: Int = 7000         // the type written out
    println(weight * rate)
}
```

This program prints `17500.0`.

Kotlin **infers** the type from the first value, so you rarely need to write it. If you want to, write it after a colon: `val rate: Int = 7000`. Once decided, a type cannot change. A `var` holding an `Int` can only be given another `Int`; assigning `"three"` to it is rejected by the compiler.

An `Int` times a `Double` gives a `Double`, and a `Double` is always printed with a digit after the point: `17500.0`, not `17500`.

## Integer division

```kotlin
fun main() {
    println(7 / 2)      // 3
    println(7 % 2)      // 1
    println(7 / 2.0)    // 3.5
}
```

An `Int` divided by an `Int` gives an `Int`: the decimal part is dropped, not rounded. As soon as one of the numbers is a `Double`, the result is a `Double`. `%` gives the remainder.

## Conversions

Kotlin never changes a type silently. The line `val total: Int = 2.5 * 7000` is rejected, because the result of the calculation is a `Double`. You have to ask for the conversion yourself:

```kotlin
fun main() {
    val weightText = "4"
    val weight = weightText.toInt()    // 4
    val total = (2.5 * 7000).toInt()   // 17500
    val whole = 3.9.toInt()            // 3, not 4
    val decimal = weight.toDouble()    // 4.0
    println("$weight $total $whole $decimal")
}
```

This program prints `4 17500 3 4.0`. `toInt()` on a `Double` drops the decimal part.

## Compared with Python

- In Python, `7 / 2` is `3.5` and `7 // 2` is `3`. In Kotlin, `7 / 2` is `3`.
- Python writes `int("4")`; Kotlin writes `"4".toInt()`.
- A Python variable may change type at any time. In Kotlin, types are checked before the program runs, so many mistakes are caught earlier.
