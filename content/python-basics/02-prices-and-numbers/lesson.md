---
title: Harga dan angka
---
Bu Rina bertanya, "Kalau ada yang beli dua kopi susu, totalnya berapa?" Komputer bisa menghitung itu, asal kita beri nama pada angkanya.

## Variabel

**Variabel** adalah nama untuk menyimpan nilai:

```python
harga = 15000
jumlah = 2
total = harga * jumlah
print(total)
```

Hasilnya `30000`. Tanda `=` di sini berarti "simpan nilai di sebelah kanan ke nama di sebelah kiri".

## Operasi hitung

| Operator | Artinya | Contoh | Hasil |
| --- | --- | --- | --- |
| `+` | tambah | `7 + 2` | `9` |
| `-` | kurang | `7 - 2` | `5` |
| `*` | kali | `7 * 2` | `14` |
| `/` | bagi (hasil desimal) | `7 / 2` | `3.5` |
| `//` | bagi (dibulatkan ke bawah) | `7 // 2` | `3` |
| `%` | sisa bagi | `7 % 2` | `1` |

Urutannya seperti di matematika: kali dan bagi dikerjakan sebelum tambah dan kurang. Pakai tanda kurung untuk mengubah urutan.

## Membaca angka dari input

`input()` membaca satu baris yang diketik pengguna, dan hasilnya selalu **teks**. Ubah jadi angka dengan `int()`:

```python
jumlah = int(input())
```

Di latihan, nilai input sudah disiapkan oleh tes, jadi kamu tidak perlu mengetiknya sendiri.
