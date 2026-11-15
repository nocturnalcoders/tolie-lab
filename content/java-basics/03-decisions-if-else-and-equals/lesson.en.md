---
title: "Decisions: if, else and equals"
---
Lentera Bookshop gives a discount on large purchases, and more easily to members. The till program has to make a decision.

```java
public class Discount {
    public static void main(String[] args) {
        int total = 180000;
        boolean member = true;

        if (total >= 200000) {
            System.out.println("15% discount");
        } else if (total >= 100000 && member) {
            System.out.println("10% discount");
        } else {
            System.out.println("No discount");
        }
    }
}
```

```
10% discount
```

How to read it:

- The condition is always inside **parentheses** `( )`, and its block inside `{ }`. There is no colon.
- Java checks from the top and stops at the **first** branch that is true. Later branches are skipped, even if their conditions are true as well.
- The next choice is written `else if`, two words.

| Written | Meaning |
| --- | --- |
| `==`, `!=` | equal to, not equal to |
| `>`, `>=`, `<`, `<=` | comparing numbers |
| `&&` | and: both sides must be true |
| <code>&#124;&#124;</code> | or: one true side is enough |
| `!` | not: flips `true` and `false` |

`=` stores a value, `==` compares. A condition must be a `boolean`, so `if (stock = 0)` is rejected by the compiler.

## Comparing Strings: equals, not ==

```java
String code = "BK";
String typed = new String("BK");

System.out.println(code == typed);                  // false
System.out.println(code.equals(typed));             // true
System.out.println(code.equals("bk"));              // false
System.out.println(code.equalsIgnoreCase("bk"));    // true
```

For a `String`, `==` asks "is this the **same object**?", while `equals` asks "is the **content** the same?". Text that comes from the keyboard or a file is always a new object, so `==` can be `false` even though the text is exactly the same. This mistake compiles and shows no message at all; the program is just quietly wrong.

For `int`, `double` and `boolean`, `==` is the right way.

## Compared with Python

- `elif` becomes `else if`; `and`, `or`, `not` become `&&`, `||`, `!`.
- `==` on text in Python compares the content. Its Java counterpart is `.equals(...)`. `==` on objects in Java is more like Python's `is`.
