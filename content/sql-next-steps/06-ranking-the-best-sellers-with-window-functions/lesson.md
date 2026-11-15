---
title: Peringkat menu terlaris dengan fungsi window
---
Di pelajaran terakhir ini kamu menyusun laporan menu terlaris, lengkap dengan peringkatnya. Alat barunya adalah **fungsi window**.

`GROUP BY` meringkas banyak baris menjadi satu. Fungsi window juga menghitung dari banyak baris, tetapi **setiap baris tetap tampil** dan mendapat hasil hitungannya sendiri. Cirinya adalah kata `OVER` setelah nama fungsi.

Tabel `menu` dan `pesanan` masih sama dengan dua pelajaran terakhir.

## Jumlah berjalan

`SUM(...) OVER (ORDER BY ...)` menjumlahkan dari baris pertama sampai baris itu, menurut urutan di dalam `OVER`:

```sql
WITH bulanan AS (
  SELECT strftime('%Y-%m', p.tanggal) AS bulan,
         SUM(m.harga * p.jumlah) AS omzet
  FROM pesanan p
  JOIN menu m ON m.id = p.menu_id
  GROUP BY bulan
)
SELECT bulan, omzet, SUM(omzet) OVER (ORDER BY bulan) AS berjalan
FROM bulanan
ORDER BY bulan;
```

| bulan | omzet | berjalan |
|---|---|---|
| 2024-02 | 84000 | 84000 |
| 2024-03 | 222000 | 306000 |
| 2024-04 | 85000 | 391000 |

Kolom `berjalan` menunjukkan omzet sejak awal sampai bulan itu.

## RANK

`RANK() OVER (ORDER BY ...)` memberi nomor peringkat menurut urutan di dalam `OVER`:

```sql
WITH per_menu AS (
  SELECT m.nama, SUM(p.jumlah) AS terjual
  FROM pesanan p
  JOIN menu m ON m.id = p.menu_id
  GROUP BY m.id, m.nama
)
SELECT RANK() OVER (ORDER BY terjual DESC) AS peringkat, nama, terjual
FROM per_menu
ORDER BY peringkat, nama;
```

| peringkat | nama | terjual |
|---|---|---|
| 1 | Kopi Susu | 8 |
| 2 | Kopi Hitam | 7 |
| 3 | Nasi Goreng | 3 |
| 3 | Pisang Goreng | 3 |
| 3 | Roti Bakar | 3 |
| 3 | Teh Tarik | 3 |

Nilai yang sama mendapat peringkat yang sama, dan nomor berikutnya dilompati: setelah empat menu di peringkat 3, menu berikutnya akan berperingkat 7.

`ORDER BY` di dalam `OVER` hanya mengatur cara menghitung. Urutan baris hasil tetap ditentukan `ORDER BY` di akhir perintah, jadi jangan lupa menulisnya.
