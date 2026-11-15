---
title: Bentuk Sebuah Program Java
---
Toko Buku Lentera milik Pak Bayu memakai beberapa program Java kecil di ruang belakang: mencatat stok, menghitung penjualan, mencetak label. Sari, kasir yang baru selesai belajar Python, diminta ikut merawatnya. Langkah pertamanya bukan menulis, tetapi **membaca**. Itulah yang kita latih di kursus ini.

## Program terkecil

```java
public class Toko {
    public static void main(String[] args) {
        System.out.println("Toko Buku Lentera");
        System.out.println("Buka pukul 9");
    }
}
```

Hasilnya:

```
Toko Buku Lentera
Buka pukul 9
```

Cara membacanya, dari luar ke dalam:

- `public class Toko { ... }`: semua kode Java tinggal di dalam sebuah **class**. Class `Toko` disimpan di berkas `Toko.java`; kedua nama itu harus sama.
- `public static void main(String[] args) { ... }`: **pintu masuk** program. Java selalu mulai dari `main`. Kenali dulu bentuknya; arti tiap katanya dibahas di pelajaran 5.
- `System.out.println("...")` mencetak teks lalu pindah baris. `System.out.print("...")` mencetak tanpa pindah baris.
- Teks ditulis dengan **kutip ganda**. Kutip tunggal hanya untuk satu karakter, misalnya `'A'`.
- Setiap perintah diakhiri **titik koma** `;`.
- Kurung kurawal `{ }` menandai awal dan akhir sebuah blok. Indentasi hanya untuk kerapian, bukan aturan.
- Huruf besar dan kecil dibedakan: `System` bukan `system`.

## Dikompilasi dulu, baru dijalankan

```
javac Toko.java
java Toko
```

`javac` (compiler) memeriksa seluruh berkas dan menghasilkan `Toko.class`. Kalau ada satu saja kesalahan tulis, misalnya titik koma yang hilang, compiler menolak dan **tidak ada** yang dijalankan. Setelah lolos, barulah `java Toko` menjalankan programnya.

## Dibandingkan dengan Python

| Python | Java |
| --- | --- |
| `print("Halo")` | `System.out.println("Halo");` |
| blok ditandai indentasi | blok ditandai `{ }` |
| baris baru mengakhiri perintah | `;` mengakhiri perintah |
| salah tipe atau salah nama baru ketahuan saat baris itu dijalankan | compiler menolaknya sebelum program jalan |

Di kursus ini Java tidak dijalankan di browser. Kamu berlatih dengan menelusuri kode baris demi baris, lalu menjawab soal pilihan ganda.
