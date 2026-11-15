---
title: Total berjalan, rekor, dan duplikat
---
Banyak pekerjaan gudang selesai dengan **satu kali jalan** menyusuri data, asal kita membawa catatan kecil sambil berjalan. Tiga pola berikut muncul terus-menerus, jadi layak dihafal.

## Total berjalan

Stok kardus berubah setiap hari: bertambah saat kiriman datang, berkurang saat dipakai. Catatannya cukup satu variabel yang terus diperbarui:

```python
stok = 20
perubahan = [5, -8, 10, -3]

for p in perubahan:
    stok += p
    print(stok)   # 25, 17, 27, 24
```

Kita tidak menjumlah ulang dari awal setiap hari. Nilai kemarin dipakai lagi, sehingga setiap data hanya disentuh sekali.

## Melacak rekor

Kapan stok paling tinggi? Simpan rekor sejauh ini, dan ganti hanya kalau ada yang mengalahkannya:

```python
angka = [25, 17, 27, 24]

tertinggi = angka[0]
hari = 1
for i in range(1, len(angka)):
    if angka[i] > tertinggi:
        tertinggi = angka[i]
        hari = i + 1

print(tertinggi, hari)   # 27 3
```

Dua hal penting. Pertama, rekor awal diambil dari **data pertama**, bukan 0. Kalau semua datanya negatif, nilai awal 0 tidak akan pernah terkalahkan dan jawabannya salah. Kedua, tanda `>` (bukan `>=`) membuat rekor yang **pertama** bertahan saat ada nilai yang sama.

`max()` memang memberi nilai tertingginya, tetapi dengan pola ini kamu sekaligus tahu **kapan** rekor itu terjadi.

## Membuang duplikat tanpa mengubah urutan

Paket kadang terpindai dua kali. `set()` membuang duplikat, tetapi urutan pindainya hilang. Solusinya: pakai set hanya sebagai ingatan "sudah pernah lihat", dan simpan hasilnya di list.

```python
pindai = ["KJ-104", "KJ-221", "KJ-104"]

sudah = set()
unik = []
for resi in pindai:
    if resi not in sudah:
        sudah.add(resi)
        unik.append(resi)

print(unik)   # ['KJ-104', 'KJ-221']
```

`not in` berarti "tidak ada di dalam". Memeriksa isi set sangat cepat, hampir tidak bergantung pada jumlah isinya, jadi seluruh pekerjaan tetap satu kali jalan.
