---
title: Mencari yang belum terjual dengan LEFT JOIN
---
**SQL Dasar** ditutup dengan satu catatan kecil: Es Teh Manis tidak muncul di laporan penjualan karena belum pernah dipesan. Bagi Bu Rina, pemilik **Warung Kopi Senja**, justru itu yang ingin ia ketahui: menu mana yang tidak laku?

Tabelnya masih sama: `menu` (`id`, `nama`, `kategori`, `harga`) berisi 7 menu, dan `pesanan` (`id`, `tanggal`, `menu_id`, `jumlah`) berisi 8 pesanan pada 4 dan 5 Maret 2024.

## LEFT JOIN

`JOIN` biasa membuang baris yang tidak punya pasangan. `LEFT JOIN` mempertahankan **semua baris tabel kiri**, yaitu tabel yang ditulis setelah `FROM`. Bila pasangannya tidak ada, kolom dari tabel kanan diisi `NULL`:

```sql
SELECT m.nama, p.tanggal, p.jumlah
FROM menu m
LEFT JOIN pesanan p ON p.menu_id = m.id
ORDER BY m.id, p.id;
```

| nama | tanggal | jumlah |
|---|---|---|
| Kopi Hitam | 2024-03-05 | 4 |
| Kopi Susu | 2024-03-04 | 2 |
| Kopi Susu | 2024-03-04 | 1 |
| Kopi Susu | 2024-03-05 | 3 |
| Teh Tarik | 2024-03-04 | 3 |
| Es Teh Manis | NULL | NULL |

Di bawahnya masih ada tiga menu makanan. Es Teh Manis sekarang ikut tampil, dengan kolom pesanan yang kosong.

## Mencari yang tidak punya pasangan

Baris tanpa pasangan dikenali dari kolom tabel kanan yang `NULL`. Nilai `NULL` diperiksa dengan `IS NULL`, bukan dengan `= NULL`:

```sql
SELECT m.nama
FROM menu m
LEFT JOIN pesanan p ON p.menu_id = m.id
WHERE p.id IS NULL;
```

Hasilnya satu baris: Es Teh Manis.

## COALESCE

Untuk menu tanpa pesanan, `SUM(p.jumlah)` menghasilkan `NULL`, bukan 0. `COALESCE(a, b)` mengambil nilai pertama yang bukan `NULL`, jadi cocok untuk memberi nilai pengganti:

```sql
SELECT m.nama, COALESCE(SUM(p.jumlah), 0) AS terjual
FROM menu m
LEFT JOIN pesanan p ON p.menu_id = m.id
GROUP BY m.id, m.nama
ORDER BY m.id;
```

Es Teh Manis tampil dengan `terjual` 0. Hati-hati saat menghitung baris: `COUNT(*)` ikut menghitung baris kosong tadi, sedangkan `COUNT(p.id)` hanya menghitung nilai yang bukan `NULL`.
