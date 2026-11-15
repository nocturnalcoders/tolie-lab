---
title: Mengubah data dengan UPDATE
---
Harga susu naik, jadi Bu Rina menaikkan harga Kopi Susu di **Warung Kopi Senja**. Barisnya sudah ada di tabel `menu`. Yang perlu diubah hanya isinya.

| id | nama | kategori | harga |
|---|---|---|---|
| 1 | Kopi Hitam | minuman | 10000 |
| 2 | Kopi Susu | minuman | 15000 |
| 5 | Roti Bakar | makanan | 18000 |

## UPDATE ... SET ... WHERE

```sql
UPDATE menu
SET harga = 17000
WHERE id = 2;
```

Bacanya: di tabel `menu`, jadikan `harga` 17000, **pada baris yang `id`-nya 2**. `WHERE` di sini sama persis dengan `WHERE` pada `SELECT`: ia memilih baris mana yang kena.

Beberapa kolom bisa diubah sekaligus, dipisah koma:

```sql
UPDATE menu
SET nama = 'Kopi Susu Gula Aren', harga = 18000
WHERE id = 2;
```

## Nilai baru dari nilai lama

Di sebelah kanan `=` boleh ada hitungan yang memakai nilai lama kolom itu. Ini menaikkan semua minuman sebesar 1000:

```sql
UPDATE menu
SET harga = harga + 1000
WHERE kategori = 'minuman';
```

Satu perintah mengubah semua baris yang cocok dengan `WHERE`, bisa satu, bisa banyak, bisa juga tidak ada sama sekali. Kalau tidak ada yang cocok, tidak ada yang berubah dan tidak ada pesan galat.

## Bahaya lupa WHERE

```sql
UPDATE menu SET harga = 17000;
```

Tanpa `WHERE`, **semua baris** kena. Seluruh menu sekarang berharga 17000, dan harga lama hilang. Database tidak bertanya "yakin?" dan tidak ada tombol batal.

Kebiasaan yang menyelamatkan: sebelum `UPDATE`, jalankan dulu `SELECT` dengan `WHERE` yang sama.

```sql
SELECT * FROM menu WHERE id = 2;
```

Kalau baris yang muncul memang yang ingin kamu ubah, barulah tulis `UPDATE` dengan `WHERE` itu. Paling aman memilih baris lewat `id`, karena `id` tidak pernah kembar, sedangkan nama bisa salah ketik atau sama.
