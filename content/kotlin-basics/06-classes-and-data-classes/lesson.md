---
title: Kelas dan Data Class
---
Satu pesanan laundry punya beberapa data sekaligus: nama pelanggan, berat cucian, dan status lunas. Daripada tiga variabel terpisah, Dimas membungkusnya dalam sebuah **kelas**.

## Kelas dengan properti di konstruktor

```kotlin
class Pesanan(val pelanggan: String, var berat: Int) {
    fun total(tarif: Int) = berat * tarif
}

fun main() {
    val pesanan = Pesanan("Bu Wati", 3)
    pesanan.berat = 4
    println(pesanan.pelanggan)
    println(pesanan.total(7000))
}
```

Program ini mencetak `Bu Wati`, lalu `28000`.

Kurung setelah nama kelas adalah **konstruktor**. Parameter yang diberi `val` atau `var` langsung menjadi properti: `val` hanya bisa dibaca, `var` boleh diisi ulang. Objek dibuat dengan memanggil nama kelasnya, tanpa kata `new`. Di dalam method, properti dipakai langsung dengan namanya.

Seperti pada list, `val pesanan` hanya mengunci variabelnya. `pesanan.berat = 4` sah karena `berat` adalah `var`; `pesanan.pelanggan = "..."` ditolak karena `pelanggan` adalah `val`.

## Data class

Kalau objek kelas biasa dicetak, hasilnya sulit dibaca, misalnya `Pesanan@1b6d3586`. Untuk kelas yang tugasnya menyimpan data, tambahkan kata `data`:

```kotlin
data class Pesanan(val pelanggan: String, val berat: Int, val lunas: Boolean = false)

fun main() {
    val awal = Pesanan("Bu Wati", 3)
    val sama = Pesanan("Bu Wati", 3)
    val baru = awal.copy(lunas = true)

    println(awal)
    println(baru)
    println(awal == sama)
}
```

Program ini mencetak:

```
Pesanan(pelanggan=Bu Wati, berat=3, lunas=false)
Pesanan(pelanggan=Bu Wati, berat=3, lunas=true)
true
```

Kata `data` memberi tiga hal secara otomatis:

- `toString` yang menampilkan nama kelas dan setiap properti dalam bentuk `nama=nilai`. Teks tidak diberi tanda kutip.
- `==` yang membandingkan **isi**, bukan objeknya.
- `copy`, yang membuat objek **baru** dengan beberapa properti diganti. Objek asal tidak berubah: `awal.lunas` tetap `false`.

## Dibanding Python

- Tidak ada `__init__` dan tidak ada `self`: properti ditulis di konstruktor dan dipakai langsung.
- `data class` mirip `@dataclass` di Python.
- Properti `val` benar-benar tidak bisa diisi ulang, sedangkan atribut objek Python selalu bisa diganti.

Selamat, kamu sekarang bisa membaca kode kasir Laundry Bersih Wangi dari `fun main` sampai `data class`.
