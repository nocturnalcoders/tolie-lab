---
title: Pencarian biner pada rak yang terurut
---
Pak Darto merapikan gudang: paket sekarang disusun **urut menurut nomor resi**, dari yang terkecil. Dengan rak yang terurut, kita bisa mencari seperti membuka kamus: lihat bagian tengah, lalu buang separuh yang pasti tidak berisi jawabannya.

## Membagi dua

```python
resi = [105, 118, 124, 131, 140, 152, 167]
dicari = 152

kiri = 0
kanan = len(resi) - 1
posisi = 0
langkah = 0
while kiri <= kanan:
    tengah = (kiri + kanan) // 2
    langkah += 1
    if resi[tengah] == dicari:
        posisi = tengah + 1
        break
    elif resi[tengah] < dicari:
        kiri = tengah + 1
    else:
        kanan = tengah - 1

print(posisi, langkah)   # 6 2
```

`kiri` dan `kanan` adalah batas wilayah yang masih mungkin berisi paketnya. `while` mengulang selama syaratnya benar, di sini selama wilayahnya belum habis.

Ikuti jalannya: tengah pertama adalah indeks 3, isinya `131`. Itu lebih kecil dari `152`, jadi indeks 0 sampai 3 dibuang dengan `kiri = tengah + 1`. Tengah berikutnya indeks 5, isinya `152`. Ketemu dalam 2 langkah, padahal pencarian linear perlu 6.

Kalau `kiri` sudah melewati `kanan`, wilayahnya kosong dan paketnya memang tidak ada.

## Mengapa jauh lebih cepat

Setiap langkah membuang **separuh** sisa rak. Berapa kali sebuah angka bisa dibagi dua sebelum habis?

```python
n = 1000
langkah = 0
while n > 0:
    n = n // 2
    langkah += 1
print(langkah)   # 10
```

Untuk 1.000 paket paling banyak 10 langkah. Untuk 1.000.000 paket hanya 20. Pencarian linear tumbuh seiring `n`, sedangkan pencarian biner hanya bertambah satu langkah setiap kali jumlah paket **berlipat dua**.

## Syaratnya

Pencarian biner hanya benar kalau datanya **terurut**. Pada rak yang acak, melihat isi tengah tidak memberi tahu apa pun tentang separuh kiri dan kanan, sehingga tidak ada yang boleh dibuang.
