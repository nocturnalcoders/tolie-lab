---
title: Perintah di dalam perintah dengan subquery
---
"Menu mana yang harganya di atas rata-rata?" Pertanyaan Bu Rina ini butuh dua langkah: hitung rata-ratanya dulu, lalu bandingkan tiap menu dengan angka itu. Wajar bila kamu mencoba menulis `WHERE harga > AVG(harga)`, tetapi itu gagal: `WHERE` memeriksa baris satu per satu dan tidak boleh berisi fungsi agregat.

Jalan keluarnya adalah **subquery**: sebuah `SELECT` di dalam tanda kurung, di dalam perintah lain. Database mengerjakan yang di dalam kurung lebih dulu.

## Subquery yang menghasilkan satu nilai

Subquery yang hasilnya satu baris dan satu kolom boleh dipakai di tempat sebuah angka:

```sql
SELECT nama, harga
FROM menu
WHERE harga > (SELECT AVG(harga) FROM menu)
ORDER BY harga DESC;
```

Rata-rata harga tujuh menu sekitar 14286, jadi hasilnya:

| nama | harga |
|---|---|
| Nasi Goreng | 25000 |
| Roti Bakar | 18000 |
| Kopi Susu | 15000 |

Angka 14286 tidak ditulis tangan. Kalau besok ada menu baru, rata-ratanya dihitung ulang sendiri.

Subquery seperti ini juga boleh ditaruh di `SELECT`, misalnya untuk menampilkan selisih tiap harga dari harga termahal:

```sql
SELECT nama, (SELECT MAX(harga) FROM menu) - harga AS selisih
FROM menu
ORDER BY id;
```

## Subquery yang menghasilkan daftar

Subquery satu kolom dengan banyak baris menghasilkan sebuah daftar, dan `IN` memeriksa apakah suatu nilai ada di daftar itu. Menu yang dipesan pada 5 Maret:

```sql
SELECT nama
FROM menu
WHERE id IN (SELECT menu_id FROM pesanan WHERE tanggal = '2024-03-05')
ORDER BY id;
```

| nama |
|---|
| Kopi Hitam |
| Kopi Susu |
| Pisang Goreng |
| Nasi Goreng |

Bedanya dengan `JOIN`: di sini setiap menu tampil paling banyak satu kali, berapa kali pun ia dipesan hari itu. `NOT IN` adalah kebalikannya, yaitu nilai yang tidak ada di daftar.
