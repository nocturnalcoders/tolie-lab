---
title: Rekap harian dengan fungsi agregat
---
Tiap malam Bu Rina ingin tahu: berapa transaksi hari ini, dan berapa uang yang masuk? Penjualan dicatat di tabel `penjualan`. Satu baris adalah satu transaksi: tanggal, menu yang dibeli, `jumlah` porsi, dan `subtotal` dalam rupiah.

| id | tanggal | item | jumlah | subtotal |
|---|---|---|---|---|
| 1 | 2024-03-01 | Kopi Susu | 3 | 45000 |
| 2 | 2024-03-01 | Roti Bakar | 1 | 18000 |
| 3 | 2024-03-01 | Teh Tarik | 2 | 24000 |
| 4 | 2024-03-01 | Kopi Susu | 2 | 30000 |
| 5 | 2024-03-02 | Kopi Hitam | 4 | 40000 |
| 6 | 2024-03-02 | Nasi Goreng | 2 | 50000 |
| 7 | 2024-03-02 | Kopi Susu | 1 | 15000 |
| 8 | 2024-03-02 | Pisang Goreng | 3 | 36000 |
| 9 | 2024-03-03 | Teh Tarik | 1 | 12000 |
| 10 | 2024-03-03 | Kopi Susu | 4 | 60000 |
| 11 | 2024-03-03 | Roti Bakar | 2 | 36000 |

## Fungsi agregat

Fungsi agregat meringkas banyak baris menjadi **satu** nilai:

- `COUNT(*)` menghitung banyaknya baris
- `SUM(kolom)` menjumlahkan
- `AVG(kolom)` menghitung rata-rata
- `MIN(kolom)` dan `MAX(kolom)` mencari nilai terkecil dan terbesar

```sql
SELECT COUNT(*) AS transaksi, SUM(jumlah) AS porsi FROM penjualan;
```

Hasilnya satu baris saja: `11|25`. Beri nama dengan `AS`, sebab tanpa itu nama kolomnya menjadi `COUNT(*)`.

## Agregat dengan WHERE

`WHERE` menyaring lebih dulu, lalu agregat menghitung baris yang tersisa:

```sql
SELECT SUM(subtotal) AS omzet FROM penjualan WHERE tanggal = '2024-03-02';
```

Hasilnya `141000`. Tanggal disimpan sebagai teks `tahun-bulan-hari`, jadi ditulis dengan kutip.

## Rata-rata dan pembulatan

Rata-rata jarang bulat. `ROUND(nilai)` membulatkannya ke bilangan bulat terdekat:

```sql
SELECT ROUND(AVG(jumlah)) AS rata_rata FROM penjualan;
```

Rata-ratanya 2,27 porsi per transaksi, jadi hasilnya `2`.
