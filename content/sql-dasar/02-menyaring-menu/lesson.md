---
title: Menyaring baris dengan WHERE
---
Pelanggan sering bertanya: "Minuman apa yang di bawah lima belas ribu?" Untuk menjawabnya kita tidak butuh semua baris, hanya yang memenuhi syarat. Itulah tugas `WHERE`.

Tabel `menu` masih sama:

| id | nama | kategori | harga |
|---|---|---|---|
| 1 | Kopi Hitam | minuman | 10000 |
| 2 | Kopi Susu | minuman | 15000 |
| 3 | Teh Tarik | minuman | 12000 |
| 4 | Es Teh Manis | minuman | 8000 |
| 5 | Roti Bakar | makanan | 18000 |
| 6 | Pisang Goreng | makanan | 12000 |
| 7 | Nasi Goreng | makanan | 25000 |

## Syarat perbandingan

`WHERE` ditulis setelah `FROM`. Hanya baris yang syaratnya benar yang ditampilkan:

```sql
SELECT nama, harga FROM menu WHERE harga > 15000 ORDER BY id;
```

Hasilnya Roti Bakar dan Nasi Goreng. Pembandingnya: `=`, `<>` (tidak sama), `<`, `<=`, `>`, `>=`. Teks ditulis dengan kutip tunggal:

```sql
SELECT nama FROM menu WHERE kategori = 'makanan' ORDER BY id;
```

## AND dan OR

`AND` menuntut kedua syarat benar, `OR` cukup salah satunya:

```sql
SELECT nama FROM menu
WHERE kategori = 'makanan' AND harga >= 18000
ORDER BY id;
```

Kalau `AND` dan `OR` dicampur, pakai tanda kurung supaya maksudnya jelas, karena `AND` dikerjakan lebih dulu.

## Mencari teks dengan LIKE

`LIKE` mencocokkan pola. Tanda `%` berarti "teks apa saja, boleh kosong":

```sql
SELECT nama FROM menu WHERE nama LIKE '%Goreng' ORDER BY id;
```

Hasilnya Pisang Goreng dan Nasi Goreng. `'Kopi%'` berarti diawali Kopi, `'%Goreng'` diakhiri Goreng, dan `'%Teh%'` memuat Teh di mana saja.

Urutan penulisannya selalu: `SELECT ... FROM ... WHERE ... ORDER BY ...`.
