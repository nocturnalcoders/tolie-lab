---
title: Membuat kelompok sendiri dengan CASE
---
Bu Rina sering bertanya dengan kelompok yang tidak ada di tabel: menu mana yang tergolong murah? Berapa omzet minuman dibanding makanan tiap hari? Kolom seperti itu bisa dibuat sendiri dengan `CASE`.

Tabel `menu` dan `pesanan` masih sama dengan pelajaran sebelumnya.

## CASE WHEN

`CASE` memeriksa syarat satu per satu dari atas, lalu memakai nilai dari syarat **pertama** yang benar. `ELSE` dipakai bila tidak ada yang benar, dan `END` menutupnya:

```sql
SELECT nama, harga,
  CASE
    WHEN harga >= 20000 THEN 'besar'
    WHEN harga >= 12000 THEN 'sedang'
    ELSE 'kecil'
  END AS ukuran
FROM menu
ORDER BY id;
```

| nama | harga | ukuran |
|---|---|---|
| Kopi Hitam | 10000 | kecil |
| Kopi Susu | 15000 | sedang |
| Teh Tarik | 12000 | sedang |
| Es Teh Manis | 8000 | kecil |
| Roti Bakar | 18000 | sedang |
| Pisang Goreng | 12000 | sedang |
| Nasi Goreng | 25000 | besar |

Urutan `WHEN` penting. Nasi Goreng juga memenuhi `harga >= 12000`, tetapi syarat di atasnya sudah lebih dulu benar. Tanpa `ELSE`, baris yang tidak cocok dengan syarat mana pun mendapat `NULL`.

## CASE di dalam SUM

`CASE` boleh ditaruh di dalam fungsi agregat. Caranya: baris yang cocok menyumbang nilainya, baris lain menyumbang 0. Dengan begitu satu perintah bisa menghitung beberapa jumlah sekaligus:

```sql
SELECT
  SUM(CASE WHEN m.kategori = 'minuman' THEN p.jumlah ELSE 0 END) AS porsi_minuman,
  SUM(CASE WHEN m.kategori = 'makanan' THEN p.jumlah ELSE 0 END) AS porsi_makanan
FROM pesanan p
JOIN menu m ON m.id = p.menu_id;
```

Hasilnya satu baris: `13|5`. Tambahkan `GROUP BY p.tanggal`, dan kamu mendapat satu baris per hari dengan kolom minuman dan makanan berdampingan.

`ELSE 0` di sini penting. Tanpa itu, hari yang tidak punya pesanan makanan akan tampil `NULL`, bukan 0.
