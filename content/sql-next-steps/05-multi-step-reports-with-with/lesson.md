---
title: Laporan bertahap dengan WITH
---
Laporan Bu Rina makin sering butuh beberapa langkah: hitung omzet tiap hari dulu, baru cari hari yang terbaik. Subquery bisa mengerjakannya, tetapi perintahnya cepat menjadi sulit dibaca. `WITH` memberi **nama** pada hasil sebuah `SELECT`, lalu nama itu dipakai seperti tabel. Hasil bernama ini disebut **CTE**.

Tabel `menu` dan `pesanan` sama dengan pelajaran sebelumnya: 12 pesanan dari Februari sampai April 2024.

## Satu langkah, satu nama

```sql
WITH harian AS (
  SELECT p.tanggal, SUM(m.harga * p.jumlah) AS omzet
  FROM pesanan p
  JOIN menu m ON m.id = p.menu_id
  GROUP BY p.tanggal
)
SELECT tanggal, omzet
FROM harian
WHERE omzet = (SELECT MAX(omzet) FROM harian);
```

Hasilnya `2024-03-01|65000`, hari dengan omzet tertinggi. Bacanya dari atas: `harian` adalah omzet per hari, lalu perintah utama memilih dari `harian`. Nama itu boleh dipakai lebih dari sekali, di sini di `FROM` dan di dalam subquery.

CTE bukan tabel sungguhan. Ia hanya ada selama satu perintah itu berjalan dan tidak tersimpan di database.

## Beberapa langkah

CTE berikutnya ditulis setelah koma, tanpa mengulang `WITH`, dan boleh memakai CTE di atasnya:

```sql
WITH harian AS (
  SELECT p.tanggal, SUM(m.harga * p.jumlah) AS omzet
  FROM pesanan p
  JOIN menu m ON m.id = p.menu_id
  GROUP BY p.tanggal
),
bulanan AS (
  SELECT strftime('%Y-%m', tanggal) AS bulan,
         COUNT(*) AS hari_buka,
         MAX(omzet) AS omzet_terbaik
  FROM harian
  GROUP BY bulan
)
SELECT bulan, hari_buka, omzet_terbaik
FROM bulanan
ORDER BY bulan;
```

| bulan | hari_buka | omzet_terbaik |
|---|---|---|
| 2024-02 | 2 | 48000 |
| 2024-03 | 5 | 65000 |
| 2024-04 | 2 | 60000 |

Setiap langkah bisa diperiksa sendiri-sendiri: ganti perintah utama dengan `SELECT * FROM harian` untuk melihat isinya. Begitulah cara menyusun laporan yang panjang tanpa tersesat.
