---
title: Laporan per hari dan per bulan
---
Catatan pesanan Warung Kopi Senja sekarang sudah lebih panjang, dari akhir Februari sampai awal April 2024. Tabel `menu` tetap sama, dan ini tabel `pesanan`:

| id | tanggal | menu_id | jumlah |
|---|---|---|---|
| 1 | 2024-02-26 | 2 | 2 |
| 2 | 2024-02-26 | 5 | 1 |
| 3 | 2024-02-28 | 3 | 3 |
| 4 | 2024-03-01 | 2 | 1 |
| 5 | 2024-03-01 | 7 | 2 |
| 6 | 2024-03-15 | 1 | 4 |
| 7 | 2024-03-27 | 2 | 3 |
| 8 | 2024-03-29 | 6 | 3 |
| 9 | 2024-03-31 | 5 | 2 |
| 10 | 2024-04-01 | 2 | 2 |
| 11 | 2024-04-01 | 1 | 3 |
| 12 | 2024-04-02 | 7 | 1 |

## Tanggal adalah teks

SQLite menyimpan tanggal sebagai teks `tahun-bulan-hari`. Karena tahun ditulis lebih dulu dan angkanya selalu dua digit, urutan abjad sama dengan urutan waktu. Itu sebabnya `ORDER BY tanggal` dan perbandingan seperti ini bekerja:

```sql
SELECT COUNT(*) AS pesanan_maret
FROM pesanan
WHERE tanggal >= '2024-03-01' AND tanggal < '2024-04-01';
```

Hasilnya `6`.

## strftime: mengambil bagian tanggal

`strftime(format, tanggal)` menyusun teks baru dari sebuah tanggal. `%Y` adalah tahun, `%m` bulan, dan `%d` hari. Dengan `'%Y-%m'` setiap tanggal menjadi teks bulan, yang bisa langsung dipakai di `GROUP BY`:

```sql
SELECT strftime('%Y-%m', tanggal) AS bulan, SUM(jumlah) AS porsi
FROM pesanan
GROUP BY bulan
ORDER BY bulan;
```

| bulan | porsi |
|---|---|
| 2024-02 | 6 |
| 2024-03 | 15 |
| 2024-04 | 6 |

## date: menggeser tanggal

`date(tanggal, pergeseran)` menghitung tanggal baru dan paham kalender, termasuk tahun kabisat:

```sql
SELECT date('2024-02-28', '+1 day') AS besok,
       date('2024-03-31', '-7 days') AS seminggu_lalu;
```

Hasilnya `2024-02-29|2024-03-24`. Pergeseran lain misalnya `'+1 month'`. Hasil `date` adalah teks tanggal biasa, jadi boleh dibandingkan dengan kolom `tanggal` di `WHERE`.
