---
title: Catatan pesanan
---
Satu pesanan punya beberapa keterangan sekaligus: nama menu, jumlah, dan harga. Kalau disimpan di tiga variabel terpisah, datanya gampang tertukar. Lebih rapi kalau satu pesanan menjadi satu **dictionary**, dan semua pesanan dikumpulkan dalam satu **list**.

## Satu pesanan, satu dictionary

```python
pesanan = {"nama": "kopi susu", "jumlah": 2, "harga": 15000}

print(pesanan["nama"])                       # kopi susu
print(pesanan["jumlah"] * pesanan["harga"])  # 30000
```

Kuncinya sama untuk setiap pesanan, hanya nilainya yang berbeda. Dictionary seperti ini sering disebut **catatan** (*record*).

## Banyak pesanan, satu list

Mulai dari list kosong, lalu tambahkan catatan satu per satu dengan `.append`:

```python
daftar = []
daftar.append({"nama": "kopi susu", "jumlah": 2, "harga": 15000})
daftar.append({"nama": "roti bakar", "jumlah": 1, "harga": 18000})

print(len(daftar))         # 2
print(daftar[0]["nama"])   # kopi susu
```

`daftar[0]` mengambil catatan pertama, lalu `["nama"]` mengambil isinya.

## Mengulang semua catatan

```python
total = 0
for p in daftar:
    total += p["jumlah"] * p["harga"]
print(total)   # 48000
```

Di setiap putaran, `p` adalah satu dictionary utuh.

## Memilih sebagian

Gabungkan `for` dengan `if` untuk mengambil catatan yang memenuhi syarat saja:

```python
for p in daftar:
    if p["jumlah"] >= 2:
        print(p["nama"])   # kopi susu
```
