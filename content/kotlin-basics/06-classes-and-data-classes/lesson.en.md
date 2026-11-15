---
title: Classes and Data Classes
---
One laundry order carries several pieces of data at once: the customer's name, the weight, and whether it has been paid. Instead of three separate variables, Dimas wraps them in a **class**.

## A class with properties in the constructor

```kotlin
class Order(val customer: String, var weight: Int) {
    fun total(rate: Int) = weight * rate
}

fun main() {
    val order = Order("Mrs. Wati", 3)
    order.weight = 4
    println(order.customer)
    println(order.total(7000))
}
```

This program prints `Mrs. Wati`, then `28000`.

The parentheses after the class name are the **constructor**. A parameter marked `val` or `var` becomes a property right away: a `val` can only be read, a `var` may be reassigned. An object is created by calling the class name, without the word `new`. Inside a method, properties are used directly by name.

As with lists, `val order` only locks the variable. `order.weight = 4` is valid because `weight` is a `var`; `order.customer = "..."` is rejected because `customer` is a `val`.

## Data classes

When an object of an ordinary class is printed, the result is hard to read, for example `Order@1b6d3586`. For a class whose job is to hold data, add the word `data`:

```kotlin
data class Order(val customer: String, val weight: Int, val paid: Boolean = false)

fun main() {
    val first = Order("Mrs. Wati", 3)
    val same = Order("Mrs. Wati", 3)
    val updated = first.copy(paid = true)

    println(first)
    println(updated)
    println(first == same)
}
```

This program prints:

```
Order(customer=Mrs. Wati, weight=3, paid=false)
Order(customer=Mrs. Wati, weight=3, paid=true)
true
```

The word `data` gives you three things automatically:

- A `toString` that shows the class name and every property as `name=value`. Text gets no quotation marks.
- An `==` that compares the **contents**, not the objects.
- `copy`, which makes a **new** object with some properties replaced. The original does not change: `first.paid` is still `false`.

## Compared with Python

- There is no `__init__` and no `self`: properties are written in the constructor and used directly.
- A `data class` is similar to `@dataclass` in Python.
- A `val` property really cannot be reassigned, while an attribute of a Python object can always be replaced.

Congratulations, you can now read the Bersih Wangi Laundry cashier code from `fun main` to `data class`.
