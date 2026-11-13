---
title: Rekap harian dengan perulangan
---
Tiap malam, Bu Rina mencatat penjualan harian. Menjumlahkan satu per satu itu melelahkan, padahal komputer paling pandai mengulang.

## for dan range

`for` mengulang blok kode. `range(n)` menghasilkan angka `0` sampai `n - 1`:

```python
for i in range(3):
    print(i)
```

Hasilnya:

```
0
1
2
```

Kalau nomor urutnya tidak dipakai, kebiasaannya menulis `_` sebagai nama variabel: `for _ in range(3):`.

## Mengumpulkan total

Siapkan variabel awal, lalu tambahkan di setiap putaran:

```python
total = 0
for _ in range(3):
    total += 5
print(total)
```

`total += 5` artinya `total = total + 5`. Hasilnya `15`.

## Membaca banyak baris

Pola umum soal: baris pertama berisi jumlah data `n`, lalu `n` baris berikutnya berisi datanya.

```python
n = int(input())
total = 0
for _ in range(n):
    total += int(input())
print(total)
```
