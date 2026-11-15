---
title: Fungsi dan Koleksi
---
Menjelang sore, Bu Laras ingin tahu total pemasukan hari itu. Dimas butuh dua hal: **fungsi** supaya rumus harga ditulis sekali saja, dan **koleksi** untuk menyimpan banyak pesanan.

## Fungsi

```kotlin
fun hitungTotal(berat: Int, tarif: Int): Int {
    return berat * tarif
}
```

Setiap parameter ditulis bersama tipenya, dan tipe hasil ditulis setelah kurung tutup. Kalau isinya hanya satu ekspresi, fungsi boleh disingkat dengan `=`; tipe hasilnya disimpulkan Kotlin:

```kotlin
fun hitungTotal(berat: Int, tarif: Int = 7000) = berat * tarif

fun main() {
    println(hitungTotal(3))
    println(hitungTotal(3, 12000))
}
```

Program ini mencetak `21000`, lalu `36000`. `tarif: Int = 7000` adalah **nilai bawaan**: dipakai kalau pemanggil tidak mengisi `tarif`.

## List

```kotlin
fun main() {
    val layanan = listOf("cuci", "setrika")
    val antrean = mutableListOf("Bu Wati")
    antrean.add("Pak Joko")
    println(antrean)
    println(layanan[0])

    for (nama in antrean) {
        println("Panggil $nama")
    }
}
```

Program ini mencetak `[Bu Wati, Pak Joko]`, `cuci`, `Panggil Bu Wati`, dan `Panggil Pak Joko`, masing-masing di barisnya sendiri.

`listOf` membuat list yang hanya bisa dibaca: tidak ada `add`. `mutableListOf` membuat list yang isinya boleh berubah. Perhatikan bahwa `antrean` tetap `val`: yang terkunci adalah variabelnya (tidak bisa diganti list lain), bukan isi list-nya.

## filter, map, sumOf

```kotlin
fun main() {
    val berat = listOf(2, 6, 3, 8)
    val besar = berat.filter { it >= 5 }
    val harga = berat.map { it * 7000 }
    val total = berat.sumOf { it * 7000 }
    println(besar)
    println(harga)
    println(total)
}
```

Program ini mencetak `[6, 8]`, `[14000, 42000, 21000, 56000]`, dan `133000`.

Bagian `{ ... }` adalah **lambda**, fungsi kecil tanpa nama, dan `it` adalah elemen yang sedang diproses. `filter` menyimpan elemen yang lambdanya bernilai `true`, `map` mengubah tiap elemen, dan `sumOf` menjumlahkan hasilnya. Semuanya membuat nilai baru; list aslinya tidak berubah.

## Dibanding Python

- `def total(berat, tarif=7000):` menjadi `fun total(berat: Int, tarif: Int = 7000)`.
- `[b for b in berat if b >= 5]` menjadi `berat.filter { it >= 5 }`.
- `sum(b * 7000 for b in berat)` menjadi `berat.sumOf { it * 7000 }`.
- List Python selalu bisa diubah. Di Kotlin kamu memilih `listOf` atau `mutableListOf`.
