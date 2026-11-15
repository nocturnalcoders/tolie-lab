---
title: Menghapus baris dengan DELETE
---
Tidak semua data perlu disimpan selamanya. Ada menu yang berhenti dijual, ada pesanan yang salah ketik. Di **Warung Kopi Senja**, kasir kadang tidak sengaja menyimpan pesanan dengan jumlah 0:

| id | tanggal | menu_id | jumlah |
|---|---|---|---|
| 1 | 2024-03-04 | 2 | 2 |
| 2 | 2024-03-04 | 5 | 1 |
| 3 | 2024-03-04 | 3 | 0 |
| 4 | 2024-03-04 | 2 | 1 |

## DELETE FROM ... WHERE

```sql
DELETE FROM pesanan
WHERE id = 3;
```

`DELETE` membuang **seluruh baris**, bukan satu kolom. Karena itu tidak ada daftar kolom setelah `DELETE`. Kalau yang ingin dikosongkan hanya satu kolom, pakailah `UPDATE`.

Seperti pada `UPDATE`, `WHERE` menentukan baris mana yang kena, dan syaratnya boleh mengenai banyak baris sekaligus:

```sql
DELETE FROM pesanan
WHERE jumlah = 0;
```

Syarat bisa digabung dengan `AND` dan `OR`, sama seperti di `SELECT`:

```sql
DELETE FROM pesanan
WHERE tanggal = '2024-03-04' AND jumlah = 0;
```

Kalau tidak ada baris yang cocok, tidak ada yang dihapus dan tidak ada pesan galat.

## Lupa WHERE, lagi

```sql
DELETE FROM pesanan;
```

Tanpa `WHERE`, **semua baris** terhapus. Tabelnya masih ada, kolomnya masih ada, isinya kosong. Baris yang sudah dihapus tidak bisa dipanggil kembali.

Jadi kebiasaannya sama: lihat dulu, baru hapus.

```sql
SELECT * FROM pesanan WHERE jumlah = 0;
```

Kalau yang muncul memang baris yang ingin dibuang, ganti `SELECT *` dengan `DELETE` dan biarkan `WHERE`-nya persis sama.

## DELETE bukan DROP TABLE

Ada perintah lain yang terdengar mirip:

```sql
DROP TABLE pesanan;
```

`DROP TABLE` membuang **tabelnya sekaligus**, kolom dan semua barisnya. Setelah itu `SELECT * FROM pesanan` gagal dengan pesan `no such table`. `DELETE` mengurus baris, `DROP TABLE` mengurus tabel.

## Nomor yang hilang

Setelah baris 3 dihapus, `id` yang tersisa adalah 1, 2, 4. Itu wajar dan tidak perlu dirapikan. `id` adalah tanda pengenal, bukan nomor urut.
