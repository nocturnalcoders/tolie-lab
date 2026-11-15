---
title: Mengurutkan dan membuat peringkat
---
"Menu apa yang paling laku minggu ini?" Untuk menjawab Bu Rina, datanya harus **diurutkan** dulu. Setelah itu tinggal mengambil beberapa yang teratas.

## sorted

`sorted` menghasilkan list **baru** yang sudah terurut. List aslinya tidak berubah:

```python
harga = [15000, 10000, 18000]

print(sorted(harga))                 # [10000, 15000, 18000]
print(sorted(harga, reverse=True))   # [18000, 15000, 10000]
print(harga)                         # [15000, 10000, 18000]
```

Teks diurutkan menurut abjad. `reverse=True` membalik urutan menjadi dari besar ke kecil.

## Mengurutkan catatan dengan key

Python tidak tahu cara membandingkan dua dictionary. Beri tahu lewat `key`: sebuah fungsi yang mengambil nilai pembanding dari satu catatan.

```python
def ambil_jumlah(p):
    return p["jumlah"]

penjualan = [
    {"nama": "kopi susu", "jumlah": 10},
    {"nama": "roti bakar", "jumlah": 12},
    {"nama": "teh tarik", "jumlah": 7},
]
urut = sorted(penjualan, key=ambil_jumlah, reverse=True)
print(urut[0]["nama"])   # roti bakar
```

Perhatikan `key=ambil_jumlah` ditulis **tanpa kurung**: kita menyerahkan fungsinya, bukan memanggilnya. Untuk fungsi sependek ini ada juga bentuk singkat `key=lambda p: p["jumlah"]`, artinya sama.

Kalau ada nilai yang sama, `sorted` mempertahankan urutan aslinya, termasuk saat memakai `reverse=True`.

## Mengambil beberapa yang teratas

`[:3]` memotong list menjadi paling banyak tiga isi pertama. Kalau isinya kurang dari tiga, semuanya diambil tanpa error:

```python
tiga_teratas = urut[:3]
```

## Nomor peringkat

`enumerate(list, 1)` memberi nomor urut mulai dari 1 pada setiap isi:

```python
for nomor, p in enumerate(urut, 1):
    print(f"{nomor}. {p['nama']}")
```

Hasilnya:

```
1. roti bakar
2. kopi susu
3. teh tarik
```
