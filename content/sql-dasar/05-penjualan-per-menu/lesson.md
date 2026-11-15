---
title: Mengelompokkan dengan GROUP BY dan HAVING
---
Rekap satu hari sudah bisa. Tapi Bu Rina ingin rekap **tiap** hari sekaligus, dan ingin tahu menu mana yang paling laris. Menulis satu perintah per hari atau per menu jelas melelahkan. `GROUP BY` mengerjakannya dalam satu perintah.

Tabel `penjualan` masih sama dengan pelajaran sebelumnya: `id`, `tanggal`, `item`, `jumlah`, `subtotal`, berisi 11 transaksi selama tiga hari.

## GROUP BY

`GROUP BY` mengumpulkan baris yang nilainya sama ke dalam satu kelompok, lalu fungsi agregat dihitung **per kelompok**:

```sql
SELECT tanggal, COUNT(*) AS transaksi, SUM(subtotal) AS omzet
FROM penjualan
GROUP BY tanggal
ORDER BY tanggal;
```

| tanggal | transaksi | omzet |
|---|---|---|
| 2024-03-01 | 4 | 117000 |
| 2024-03-02 | 4 | 141000 |
| 2024-03-03 | 3 | 108000 |

Hasilnya satu baris per kelompok. Aturannya: kolom di `SELECT` harus kolom yang dipakai di `GROUP BY`, atau berada di dalam fungsi agregat.

## Mengurutkan menurut hasil agregat

Nama yang diberikan dengan `AS` boleh dipakai di `ORDER BY`:

```sql
SELECT tanggal, SUM(subtotal) AS omzet
FROM penjualan
GROUP BY tanggal
ORDER BY omzet DESC, tanggal;
```

Sekarang hari paling ramai tampil paling atas.

## HAVING

`WHERE` menyaring baris **sebelum** dikelompokkan, jadi tidak bisa memakai hasil agregat. Untuk menyaring **kelompok**, pakai `HAVING` setelah `GROUP BY`:

```sql
SELECT tanggal, SUM(subtotal) AS omzet
FROM penjualan
GROUP BY tanggal
HAVING SUM(subtotal) > 110000
ORDER BY tanggal;
```

Hanya 1 dan 2 Maret yang tampil, karena omzet 3 Maret cuma 108000.

Urutan lengkapnya: `SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT ...`.
