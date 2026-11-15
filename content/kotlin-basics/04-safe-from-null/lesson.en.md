---
title: Safe from null
---
Not every customer of Mrs. Laras wants to leave a phone number. In the app, data that "is not there" is written as `null`. In many languages, `null` is why apps suddenly stop. Kotlin makes you think about it from the start.

## String and String?

```kotlin
val name: String = "Mrs. Wati"
val phone: String? = null
```

A `String` may **never** hold `null`. If a value is allowed to be empty, its type gets a question mark: `String?`. The line `val name: String = null` is rejected by the compiler.

Because `phone` might be `null`, Kotlin also rejects `phone.length`. You have to pick one of the ways below.

## ?. and ?:

```kotlin
fun main() {
    val phone: String? = null
    println(phone?.length)
    println(phone?.length ?: 0)
    println(phone ?: "no number yet")
}
```

This program prints:

```
null
0
no number yet
```

- `?.` (safe call): if `phone` is not `null`, take its `length`; if it is `null`, the result is `null` and the program keeps running.
- `?:` (the Elvis operator): use the value on the left if it is not `null`, otherwise use the value on the right. Ideal for a fallback value.

## Checking with if

```kotlin
fun main() {
    val phone: String? = "0812345"
    if (phone != null) {
        println(phone.length)
    }
}
```

This program prints `7`. Inside the `if`, Kotlin knows `phone` cannot be `null`, so `phone.length` is allowed.

## !! and its danger

`phone!!` means "trust me, this is not `null`". The compiler stops checking. If it turns out to be `null`, the program stops while running with a `NullPointerException`: exactly the accident Kotlin is trying to prevent. Reach for `?.`, `?:` or `if` first; `!!` is the last resort.

## Compared with Python

In Python, `None` can go into any variable, and `len(phone)` only fails while the program runs, perhaps in front of a customer. In Kotlin, the possibility of `null` is written in the type, and that mistake is caught before the app ever reaches the cashier.
