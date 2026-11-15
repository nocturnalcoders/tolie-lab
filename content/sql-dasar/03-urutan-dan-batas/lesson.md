---
title: Mengurutkan dengan ORDER BY dan membatasi dengan LIMIT
---
"Yang paling murah apa, Bu?" Pertanyaan seperti ini dijawab dengan mengurutkan baris, lalu mengambil beberapa yang teratas.

## ORDER BY

`ORDER BY` mengurutkan hasil menurut sebuah kolom, dari kecil ke besar:

```sql
SELECT nama, harga FROM menu ORDER BY harga;
```

Tambahkan `DESC` untuk urutan terbalik, dari besar ke kecil. Kebalikannya, `ASC`, adalah bawaan sehingga jarang ditulis:

```sql
SELECT nama, harga FROM menu ORDER BY harga DESC;
```

Kolom teks diurutkan menurut abjad.

## Kalau nilainya sama

Teh Tarik dan Pisang Goreng sama-sama 12000. Siapa yang tampil lebih dulu? Tanpa aturan tambahan, database bebas memilih. Beri kolom kedua sebagai penentu:

```sql
SELECT nama, harga FROM menu ORDER BY harga, nama;
```

| nama | harga |
|---|---|
| Es Teh Manis | 8000 |
| Kopi Hitam | 10000 |
| Pisang Goreng | 12000 |
| Teh Tarik | 12000 |
| Kopi Susu | 15000 |
| Roti Bakar | 18000 |
| Nasi Goreng | 25000 |

Tiap kolom punya arahnya sendiri: `ORDER BY harga DESC, nama` berarti harga dari yang termahal, dan bila sama, nama menurut abjad.

## LIMIT

`LIMIT n` hanya mengambil `n` baris pertama. Dipasangkan dengan `ORDER BY`, ini cara mencari "yang paling":

```sql
SELECT nama, harga FROM menu ORDER BY harga, nama LIMIT 2;
```

Hasilnya dua menu termurah: Es Teh Manis dan Kopi Hitam.

Urutan penulisannya: `SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT ...`. `LIMIT` selalu paling akhir, dan `WHERE` (bila ada) menyaring dulu sebelum baris diurutkan.
