---
title: Membaca baris data
---
Mesin kasir Warung Kopi Senja bisa mengekspor transaksi sebagai teks, satu transaksi per baris, dengan koma sebagai pemisah. Format seperti ini disebut **CSV** dan dipakai di hampir semua kantor. Tugas kita mengubah teks mentah itu menjadi catatan yang bisa dihitung.

## Memecah menjadi kolom

```python
baris = "08:15,kopi susu,2,15000"
kolom = baris.split(",")

print(kolom)      # ['08:15', 'kopi susu', '2', '15000']
print(kolom[1])   # kopi susu
```

Semua hasil `split` masih berupa **teks**, termasuk `'2'` dan `'15000'`. Ubah dulu dengan `int` sebelum dihitung:

```python
jumlah = int(kolom[2])
harga = int(kolom[3])
print(jumlah * harga)   # 30000
```

## Data yang diketik tangan

Data sungguhan jarang rapi. Spasi dan huruf besar bisa muncul di mana saja:

```python
kolom = " Kopi Susu , 2 ,15000".split(",")
print(kolom)   # [' Kopi Susu ', ' 2 ', '15000']
```

`split` tidak membuang spasi. Rapikan teksnya dengan `.strip()` dan `.lower()`. Untuk angka, `int` sudah mengabaikan spasi di pinggir, jadi `int(" 2 ")` hasilnya `2`.

## Satu fungsi untuk satu baris

Bungkus langkah-langkah tadi dalam fungsi yang mengubah satu baris menjadi satu catatan:

```python
def urai(baris):
    kolom = baris.split(",")
    return {
        "menu": kolom[1].strip().lower(),
        "jumlah": int(kolom[2]),
        "harga": int(kolom[3]),
    }
```

## Baris judul

File CSV biasanya diawali baris judul seperti `jam,menu,jumlah,harga`. Baris itu bukan data, jadi cukup dibaca sekali lalu diabaikan:

```python
n = int(input())
input()   # lewati baris judul
for _ in range(n):
    catatan = urai(input())
```
