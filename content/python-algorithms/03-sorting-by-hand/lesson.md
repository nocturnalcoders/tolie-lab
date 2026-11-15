---
title: Mengurutkan dengan tangan sendiri
---
Truk kurir harus dimuat dari paket **teringan** supaya yang berat tidak menindih yang ringan. Kamu sudah kenal `sorted()`, tetapi apa yang sebenarnya dikerjakannya? Mari mengurutkan dengan cara yang dipakai petugas gudang sehari-hari.

## Selection sort

Idenya: cari paket teringan, taruh di depan. Lalu cari yang teringan dari **sisanya**, taruh di urutan kedua. Ulangi sampai habis.

```python
berat = [5, 2, 8, 1]
n = len(berat)

for i in range(n - 1):
    kecil = i
    for j in range(i + 1, n):
        if berat[j] < berat[kecil]:
            kecil = j
    berat[i], berat[kecil] = berat[kecil], berat[i]
    print(berat)
```

Hasil tiap putaran:

```
[1, 2, 8, 5]
[1, 2, 8, 5]
[1, 2, 5, 8]
```

`kecil` menyimpan **indeks** paket teringan yang ditemukan sejauh ini. Perulangan dalam hanya memeriksa bagian yang belum rapi, mulai dari `i + 1`.

Baris `a, b = b, a` **menukar** dua nilai sekaligus. Putaran cukup `n - 1` kali, karena kalau semua yang lain sudah di tempatnya, paket terakhir pasti juga.

## Berapa perbandingannya?

Untuk 4 paket: putaran pertama membandingkan 3 kali, lalu 2, lalu 1. Totalnya 6. Untuk 1.000 paket hampir 500.000 perbandingan. Kalau jumlah paket berlipat dua, pekerjaannya menjadi sekitar **empat kali** lipat. Cara ini mudah dipahami, tetapi lambat untuk data besar.

## Memeriksa apakah sudah urut

Memeriksa jauh lebih ringan daripada mengurutkan: cukup bandingkan setiap paket dengan tetangga kanannya, `n - 1` perbandingan.

```python
for i in range(n - 1):
    if berat[i] > berat[i + 1]:
        print("salah di indeks", i)
```

## Lalu sorted()?

`sorted()` melakukan pekerjaan yang sama dengan algoritma yang jauh lebih pintar: untuk 1.000 paket hanya perlu sekitar 10.000 perbandingan. Dalam pekerjaan nyata, **pakailah `sorted()`**. Mengurutkan sendiri berguna untuk memahami apa yang terjadi di baliknya, dan mengapa mengurutkan tidak pernah gratis.
