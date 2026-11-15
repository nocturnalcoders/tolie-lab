---
title: Tipe Data dan Angka
---
Timbangan Bu Laras menunjukkan 2,5 kg, tetapi nota hanya mengenal rupiah bulat. Di Kotlin, perbedaan seperti ini diatur oleh **tipe**.

## Empat tipe yang paling sering muncul

```kotlin
fun main() {
    val antrean = 3              // Int: angka bulat
    val berat = 2.5              // Double: angka desimal
    val lunas = false            // Boolean: true atau false
    val nama = "Bu Wati"         // String: teks
    val tarif: Int = 7000        // tipe ditulis sendiri
    println(berat * tarif)
}
```

Program ini mencetak `17500.0`.

Kotlin **menyimpulkan** tipe dari nilai pertama, jadi kamu jarang perlu menulisnya. Kalau mau, tulis setelah titik dua: `val tarif: Int = 7000`. Sekali ditentukan, tipe tidak bisa berubah. Sebuah `var` berisi `Int` hanya boleh diisi `Int` lagi; mengisinya dengan `"tiga"` ditolak kompilator.

`Int` dikali `Double` menghasilkan `Double`, dan `Double` selalu dicetak dengan angka di belakang titik: `17500.0`, bukan `17500`.

## Pembagian bilangan bulat

```kotlin
fun main() {
    println(7 / 2)      // 3
    println(7 % 2)      // 1
    println(7 / 2.0)    // 3.5
}
```

`Int` dibagi `Int` hasilnya `Int`: bagian desimalnya dibuang, bukan dibulatkan. Begitu salah satu angkanya `Double`, hasilnya `Double`. `%` memberi sisa pembagian.

## Konversi

Kotlin tidak mengubah tipe secara diam-diam. Baris `val total: Int = 2.5 * 7000` ditolak, karena hasil hitungannya `Double`. Kamu harus memintanya sendiri:

```kotlin
fun main() {
    val teksBerat = "4"
    val berat = teksBerat.toInt()      // 4
    val total = (2.5 * 7000).toInt()   // 17500
    val bulat = 3.9.toInt()            // 3, bukan 4
    val desimal = berat.toDouble()     // 4.0
    println("$berat $total $bulat $desimal")
}
```

Program ini mencetak `4 17500 3 4.0`. `toInt()` pada `Double` membuang bagian desimal.

## Dibanding Python

- Di Python, `7 / 2` adalah `3.5` dan `7 // 2` adalah `3`. Di Kotlin, `7 / 2` adalah `3`.
- Python menulis `int("4")`; Kotlin menulis `"4".toInt()`.
- Variabel Python boleh berganti tipe kapan saja. Di Kotlin tipe diperiksa sebelum program berjalan, sehingga banyak kesalahan ketahuan lebih awal.
