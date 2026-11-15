---
title: Menggabungkan tabel dengan JOIN
---
Di pelajaran terakhir kita menggabungkan semuanya menjadi laporan penjualan yang benar-benar dipakai Bu Rina.

Menulis nama menu dan harga di setiap transaksi itu boros dan rawan salah ketik. Catatan yang rapi cukup menyimpan **nomor menu**. Tabel `pesanan` berisi `menu_id`, yaitu `id` dari tabel `menu`:

| id | tanggal | menu_id | jumlah |
|---|---|---|---|
| 1 | 2024-03-04 | 2 | 2 |
| 2 | 2024-03-04 | 5 | 1 |
| 3 | 2024-03-04 | 3 | 3 |
| 4 | 2024-03-04 | 2 | 1 |
| 5 | 2024-03-05 | 7 | 2 |
| 6 | 2024-03-05 | 1 | 4 |
| 7 | 2024-03-05 | 2 | 3 |
| 8 | 2024-03-05 | 6 | 2 |

Pesanan nomor 1 adalah 2 porsi menu nomor 2. Menu apa itu, dan berapa harganya? Jawabannya ada di tabel `menu` (`id`, `nama`, `kategori`, `harga`), yang isinya masih sama dengan pelajaran 1.

## JOIN

`JOIN` menyandingkan baris dari dua tabel, dan `ON` menyebut pasangannya:

```sql
SELECT pesanan.tanggal, menu.nama, pesanan.jumlah
FROM pesanan
JOIN menu ON menu.id = pesanan.menu_id
ORDER BY pesanan.id;
```

Baris pertamanya `2024-03-04|Kopi Susu|2`. Kedua tabel punya kolom `id`, jadi tulis `tabel.kolom` supaya jelas kolom mana yang dimaksud.

## Nama pendek untuk tabel

Supaya tidak panjang, beri tabel nama pendek setelah namanya:

```sql
SELECT p.tanggal, m.nama, p.jumlah
FROM pesanan p
JOIN menu m ON m.id = p.menu_id
ORDER BY p.id;
```

## JOIN bersama GROUP BY

Hasil `JOIN` bisa disaring, dihitung, dan dikelompokkan seperti tabel biasa. Omzet tiap hari:

```sql
SELECT p.tanggal, SUM(m.harga * p.jumlah) AS omzet
FROM pesanan p
JOIN menu m ON m.id = p.menu_id
GROUP BY p.tanggal
ORDER BY p.tanggal;
```

| tanggal | omzet |
|---|---|
| 2024-03-04 | 99000 |
| 2024-03-05 | 159000 |

Satu hal lagi: `JOIN` hanya menampilkan baris yang punya pasangan. Es Teh Manis belum pernah dipesan, jadi tidak muncul di hasil mana pun di atas.
