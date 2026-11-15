---
title: Pelanggan unik dan hitungan
---
Hari ini ada 40 transaksi. Apakah itu berarti 40 orang datang? Belum tentu, karena pelanggan setia bisa membeli tiga kali sehari. Bu Rina ingin tahu **berapa orang yang berbeda**, dan siapa yang paling sering datang.

## Set: kumpulan tanpa kembaran

**Set** mirip list, tetapi setiap isi hanya disimpan sekali:

```python
pelanggan = set()
pelanggan.add("Siti")
pelanggan.add("Budi")
pelanggan.add("Siti")   # sudah ada, tidak berpengaruh

print(len(pelanggan))        # 2
print("Budi" in pelanggan)   # True
```

Set kosong dibuat dengan `set()`. Tanda `{}` saja menghasilkan dictionary kosong, bukan set.

`"Siti"` dan `"siti "` dianggap berbeda, jadi rapikan nama dulu sebelum dimasukkan.

## Set tidak punya urutan

Urutan isi set tidak bisa diandalkan dan tidak bisa diambil dengan nomor urut. Sebelum dicetak, urutkan dulu dengan `sorted`, yang mengubahnya menjadi list:

```python
for nama in sorted(pelanggan):
    print(nama)
```

Hasilnya `Budi` lalu `Siti`, selalu dalam urutan abjad.

## Menghitung kemunculan

Set hanya tahu *ada atau tidak*. Untuk tahu *berapa kali*, pakai dictionary dengan nama sebagai kunci dan hitungan sebagai nilai:

```python
hitung = {}
for nama in ["Siti", "Budi", "Siti"]:
    hitung[nama] = hitung.get(nama, 0) + 1

print(hitung)   # {'Siti': 2, 'Budi': 1}
```

`.get(nama, 0)` mengembalikan `0` untuk nama yang baru pertama kali muncul, lalu ditambah satu. Pola satu baris ini sangat sering dipakai untuk membuat rekap.

`sorted(hitung)` menghasilkan kunci-kuncinya dalam urutan abjad:

```python
for nama in sorted(hitung):
    print(f"{nama}: {hitung[nama]}")
```
