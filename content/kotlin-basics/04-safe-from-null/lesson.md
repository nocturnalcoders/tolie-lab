---
title: Aman dari null
---
Tidak semua pelanggan Bu Laras mau meninggalkan nomor telepon. Di aplikasi, data yang "tidak ada" ditulis sebagai `null`. Di banyak bahasa, `null` adalah sumber aplikasi yang tiba-tiba berhenti. Kotlin memaksa kamu memikirkannya sejak awal.

## String dan String?

```kotlin
val nama: String = "Bu Wati"
val telepon: String? = null
```

`String` **tidak pernah** boleh berisi `null`. Kalau sebuah nilai boleh kosong, tipenya diberi tanda tanya: `String?`. Baris `val nama: String = null` ditolak kompilator.

Karena `telepon` mungkin `null`, Kotlin juga menolak `telepon.length`. Kamu harus memilih salah satu cara berikut.

## ?. dan ?:

```kotlin
fun main() {
    val telepon: String? = null
    println(telepon?.length)
    println(telepon?.length ?: 0)
    println(telepon ?: "belum ada nomor")
}
```

Program ini mencetak:

```
null
0
belum ada nomor
```

- `?.` (panggilan aman): kalau `telepon` bukan `null`, ambil `length`; kalau `null`, hasilnya `null` dan program tetap berjalan.
- `?:` (operator Elvis): pakai nilai di kiri kalau bukan `null`, selain itu pakai nilai di kanan. Cocok untuk nilai pengganti.

## Memeriksa dengan if

```kotlin
fun main() {
    val telepon: String? = "0812345"
    if (telepon != null) {
        println(telepon.length)
    }
}
```

Program ini mencetak `7`. Di dalam `if`, Kotlin tahu `telepon` pasti bukan `null`, jadi `telepon.length` diizinkan.

## !! dan bahayanya

`telepon!!` berarti "percayalah, ini bukan `null`". Kompilator berhenti memeriksa. Kalau ternyata `null`, program berhenti saat berjalan dengan `NullPointerException`: persis kecelakaan yang ingin dicegah Kotlin. Pakai `?.`, `?:`, atau `if` lebih dulu; `!!` adalah pilihan terakhir.

## Dibanding Python

Di Python, `None` boleh masuk ke variabel mana pun, dan `len(telepon)` baru gagal saat program berjalan, mungkin di depan pelanggan. Di Kotlin, kemungkinan `null` tertulis di tipenya, dan kesalahan itu tertangkap sebelum aplikasi sampai ke kasir.
