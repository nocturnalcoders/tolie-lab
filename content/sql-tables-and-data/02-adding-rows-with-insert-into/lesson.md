---
title: Menambah baris dengan INSERT INTO
---
Tabel kosong belum berguna. Hari ini **Warung Kopi Senja** punya menu baru, dan Bu Rina minta kamu memasukkannya ke tabel `menu`:

| id | nama | kategori | harga |
|---|---|---|---|
| 1 | Kopi Hitam | minuman | 10000 |
| 2 | Kopi Susu | minuman | 15000 |
| 3 | Teh Tarik | minuman | 12000 |

## Satu baris

`INSERT INTO` menambah baris baru. Sebutkan tabelnya, daftar kolomnya, lalu nilainya dalam urutan yang sama:

```sql
INSERT INTO menu (id, nama, kategori, harga)
VALUES (4, 'Es Teh Manis', 'minuman', 8000);
```

Tulisan diapit tanda petik tunggal, angka tidak. Nilai pertama masuk ke kolom pertama di daftar, nilai kedua ke kolom kedua, dan seterusnya.

Daftar kolom boleh dihilangkan. Kalau begitu, nilainya harus lengkap dan mengikuti urutan kolom tabel:

```sql
INSERT INTO menu VALUES (4, 'Es Teh Manis', 'minuman', 8000);
```

Menulis daftar kolom lebih aman: kamu tidak perlu hafal urutan kolom, dan perintahnya tetap benar kalau suatu hari tabelnya ditambah kolom.

## Banyak baris sekaligus

Satu `INSERT` bisa membawa beberapa baris, dipisah koma:

```sql
INSERT INTO menu (id, nama, kategori, harga) VALUES
  (5, 'Roti Bakar', 'makanan', 18000),
  (6, 'Pisang Goreng', 'makanan', 12000);
```

## Kolom yang tidak disebut

Kolom yang tidak ada di daftar dibiarkan kosong. Kosong di SQL ditulis `NULL`, artinya "tidak ada nilai".

Ada satu pengecualian yang sangat berguna. Kalau kolom `id` dibuat sebagai `INTEGER PRIMARY KEY` (dibahas di pelajaran 5), database mengisinya sendiri dengan nomor berikutnya:

```sql
INSERT INTO pelanggan (nama, kota) VALUES ('Sari', 'Bandung');
```

Kalau `id` terbesar saat ini 2, baris baru ini mendapat `id` 3. Kamu tidak perlu tahu nomor terakhirnya.

## Memeriksa hasil

`INSERT` tidak menampilkan apa-apa. Untuk melihat hasilnya, jalankan `SELECT` sesudahnya:

```sql
SELECT * FROM menu ORDER BY id;
```
