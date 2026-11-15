---
title: Melihat isi tabel dengan SELECT
---
Catatan **Warung Kopi Senja** sekarang disimpan di sebuah **database**. Bu Rina ingin kamu bisa bertanya langsung ke data itu, dan bahasa untuk bertanya ke database adalah **SQL**.

## Tabel, baris, dan kolom

Database menyimpan data dalam **tabel**, mirip lembar kerja. Tiap **baris** adalah satu data, tiap **kolom** adalah satu jenis keterangan. Ini tabel `menu`:

| id | nama | kategori | harga |
|---|---|---|---|
| 1 | Kopi Hitam | minuman | 10000 |
| 2 | Kopi Susu | minuman | 15000 |
| 3 | Teh Tarik | minuman | 12000 |
| 4 | Es Teh Manis | minuman | 8000 |
| 5 | Roti Bakar | makanan | 18000 |
| 6 | Pisang Goreng | makanan | 12000 |
| 7 | Nasi Goreng | makanan | 25000 |

## SELECT

`SELECT` mengambil data dari tabel. Tanda `*` berarti semua kolom:

```sql
SELECT * FROM menu;
```

Biasanya kita hanya butuh beberapa kolom. Sebutkan namanya, dipisah koma:

```sql
SELECT nama, kategori FROM menu;
```

Perintah SQL diakhiri titik koma. Huruf besar pada `SELECT` dan `FROM` hanya kebiasaan supaya mudah dibaca. Baris yang diawali `--` adalah komentar.

## Menghitung dan memberi nama kolom

Kolom boleh berupa hitungan, dan `AS` memberi nama pada hasilnya:

```sql
SELECT nama, harga * 2 AS harga_berdua FROM menu;
```

## Urutan baris

Database tidak menjanjikan urutan baris. Supaya hasilnya pasti, tambahkan `ORDER BY id` di akhir (urut menurut kolom `id`). Pengurutan dibahas lengkap di pelajaran 3.

```sql
SELECT nama, harga FROM menu ORDER BY id;
```

Hasil ditampilkan sebagai teks: baris pertama nama kolom, lalu satu baris per data, dipisah `|`. Tabel yang dipakai tiap latihan bisa kamu lihat di samping editor.
