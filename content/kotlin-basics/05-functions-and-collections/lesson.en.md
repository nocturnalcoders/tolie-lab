---
title: Functions and Collections
---
Towards the evening, Mrs. Laras wants to know the day's total income. Dimas needs two things: **functions**, so the price formula is written only once, and **collections**, to hold many orders.

## Functions

```kotlin
fun orderTotal(weight: Int, rate: Int): Int {
    return weight * rate
}
```

Each parameter is written with its type, and the return type comes after the closing parenthesis. When the body is a single expression, the function can be shortened with `=`; Kotlin infers the return type:

```kotlin
fun orderTotal(weight: Int, rate: Int = 7000) = weight * rate

fun main() {
    println(orderTotal(3))
    println(orderTotal(3, 12000))
}
```

This program prints `21000`, then `36000`. `rate: Int = 7000` is a **default value**: it is used when the caller does not pass `rate`.

## Lists

```kotlin
fun main() {
    val services = listOf("wash", "iron")
    val queue = mutableListOf("Mrs. Wati")
    queue.add("Mr. Joko")
    println(queue)
    println(services[0])

    for (name in queue) {
        println("Calling $name")
    }
}
```

This program prints `[Mrs. Wati, Mr. Joko]`, `wash`, `Calling Mrs. Wati` and `Calling Mr. Joko`, each on its own line.

`listOf` makes a read-only list: there is no `add`. `mutableListOf` makes a list whose contents may change. Notice that `queue` is still a `val`: what is locked is the variable (it cannot be pointed at another list), not the contents of the list.

## filter, map, sumOf

```kotlin
fun main() {
    val weights = listOf(2, 6, 3, 8)
    val large = weights.filter { it >= 5 }
    val prices = weights.map { it * 7000 }
    val total = weights.sumOf { it * 7000 }
    println(large)
    println(prices)
    println(total)
}
```

This program prints `[6, 8]`, `[14000, 42000, 21000, 56000]` and `133000`.

The `{ ... }` part is a **lambda**, a small function without a name, and `it` is the element being processed. `filter` keeps the elements for which the lambda is `true`, `map` transforms each element, and `sumOf` adds up the results. All of them make a new value; the original list does not change.

## Compared with Python

- `def total(weight, rate=7000):` becomes `fun total(weight: Int, rate: Int = 7000)`.
- `[w for w in weights if w >= 5]` becomes `weights.filter { it >= 5 }`.
- `sum(w * 7000 for w in weights)` becomes `weights.sumOf { it * 7000 }`.
- A Python list can always be changed. In Kotlin you choose `listOf` or `mutableListOf`.
