---
title: Keputusan dengan if, when, dan Rentang
---
Laundry Bersih Wangi punya aturan harga: cucian 5 kg atau lebih mendapat tarif lebih murah, dan layanan express lebih mahal. Aplikasi kasir harus bisa memilih.

## if menghasilkan nilai

`if` bisa dipakai seperti di bahasa lain, dengan blok `{ }`. Tetapi di Kotlin `if` juga sebuah **ekspresi**: ia menghasilkan nilai yang bisa langsung disimpan.

```kotlin
fun main() {
    val berat = 5
    val tarif = if (berat >= 5) 6000 else 7000
    println("Total: Rp${berat * tarif}")
}
```

Program ini mencetak `Total: Rp30000`. Kondisi selalu ditulis dalam kurung. Kalau `if` dipakai sebagai nilai, `else` wajib ada: tanpa `else`, Kotlin tidak tahu nilainya saat kondisi salah, dan kodenya ditolak.

## when

Untuk banyak pilihan, Kotlin memakai `when`:

```kotlin
fun main() {
    val layanan = "express"
    val tarif = when (layanan) {
        "reguler" -> 7000
        "express" -> 12000
        else -> 0
    }
    println(tarif)
}
```

Program ini mencetak `12000`. Kotlin memeriksa cabang dari atas, menjalankan **satu** cabang pertama yang cocok, lalu selesai. Tidak perlu `break`. Seperti `if`, `when` yang dipakai sebagai nilai membutuhkan `else`.

## Rentang

`1..4` adalah rentang dari 1 sampai 4, dan **4 ikut terhitung**. `1 until 4` berhenti sebelum 4. Kata `in` memeriksa apakah sebuah nilai ada di dalam rentang:

```kotlin
fun main() {
    val berat = 4
    val kategori = when (berat) {
        in 1..4 -> "Kecil"
        in 5..10 -> "Sedang"
        else -> "Besar"
    }
    println(kategori)

    for (rak in 1..3) {
        println("Rak $rak")
    }
}
```

Program ini mencetak `Kecil`, lalu `Rak 1`, `Rak 2`, dan `Rak 3`, masing-masing di barisnya sendiri.

## Dibanding Python

- Python: `tarif = 6000 if berat >= 5 else 7000`. Kotlin: `val tarif = if (berat >= 5) 6000 else 7000`. Kotlin tidak punya operator `? :`.
- `when` menggantikan rangkaian `if` / `elif` / `else`.
- `range(1, 4)` di Python berisi 1, 2, 3. Di Kotlin itu sama dengan `1 until 4` atau `1..3`; sedangkan `1..4` berisi 1, 2, 3, 4.
