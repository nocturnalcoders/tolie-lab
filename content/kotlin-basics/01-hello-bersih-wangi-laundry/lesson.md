---
title: Halo, Laundry Bersih Wangi
---
Bu Laras punya usaha laundry kiloan, **Laundry Bersih Wangi**. Selama ini nota ditulis tangan. Keponakannya, Dimas, mulai membuat aplikasi kasir Android dengan **Kotlin**, dan kamu diajak ikut membaca kodenya.

Kursus ini melatih kamu **membaca** Kotlin. Kodenya tidak dijalankan di browser: kamu menelusurinya baris demi baris, lalu menjawab soal. Kalau ingin mencoba sendiri, salin kodenya ke play.kotlinlang.org.

## Program pertama

```kotlin
fun main() {
    println("Selamat datang di Laundry Bersih Wangi")
}
```

Setiap program Kotlin mulai dari fungsi `main`. `fun` berarti fungsi, isinya diapit `{ }`, dan `println` mencetak satu baris. Baris yang menjorok hanya untuk kerapian; yang menentukan isi fungsi adalah kurung kurawalnya.

## val dan var

```kotlin
fun main() {
    val tarifPerKg = 7000
    var antrean = 3
    antrean = antrean + 1
    println(antrean)
}
```

Program ini mencetak `4`.

- `val` adalah nilai tetap. Sekali diisi, tidak bisa diisi ulang. Baris `tarifPerKg = 8000` akan ditolak sebelum program sempat berjalan.
- `var` adalah variabel yang boleh diisi ulang.

Programmer Kotlin memakai `val` kapan pun bisa, dan `var` hanya kalau nilainya memang perlu berubah. Kode jadi lebih mudah dibaca: melihat `val`, kamu tahu nilainya tidak ke mana-mana.

## String template

```kotlin
fun main() {
    val nama = "Bu Wati"
    val berat = 3
    val tarif = 7000
    println("Pelanggan: $nama")
    println("Total: Rp${berat * tarif}")
}
```

Hasilnya:

```
Pelanggan: Bu Wati
Total: Rp21000
```

`$nama` diganti dengan isi variabel. Untuk hitungan, pakai `${ }`. Tanpa kurung kurawal, hanya nama tepat setelah `$` yang diganti. Teks selalu memakai kutip ganda; kutip tunggal hanya untuk satu karakter, seperti `'A'`.

## Dibanding Python

| Python | Kotlin |
| --- | --- |
| `print("Halo")` | `println("Halo")` |
| `antrean = 3` | `var antrean = 3` |
| `f"Total: {total}"` | `"Total: $total"` |
| blok ditandai indentasi | blok ditandai `{ }` |

Di Python semua variabel boleh diisi ulang. Di Kotlin kamu memilih sendiri: `val` atau `var`.
