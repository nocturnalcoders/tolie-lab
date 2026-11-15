---
title: Mencari paket satu per satu
---
Selamat datang di **Ekspedisi Kilat Jaya**, loket pengiriman kecil milik Pak Darto. Setiap hari puluhan paket menumpuk di rak gudang, dan pelanggan datang bertanya, "Paket saya sudah sampai?" Di kursus ini kamu mengajari komputer mencari, mengurutkan, dan menghitung paket. Cara kerja langkah demi langkah seperti itu disebut **algoritma**.

## Pencarian linear

Cara paling sederhana: periksa rak dari yang pertama, satu per satu, sampai nomor resinya cocok.

```python
rak = ["KJ-104", "KJ-221", "KJ-087", "KJ-150"]
dicari = "KJ-087"

posisi = 0
for i in range(len(rak)):
    if rak[i] == dicari:
        posisi = i + 1
        break

print(posisi)   # 3
```

`range(len(rak))` menghasilkan indeks 0 sampai 3. Rak di gudang dinomori dari 1, karena itu `i + 1`. Nilai awal `posisi = 0` berarti "belum ketemu".

`break` menghentikan perulangan saat itu juga. Begitu paketnya ketemu, tidak ada gunanya memeriksa rak sisanya.

## Menghitung langkah

Seberapa berat pekerjaan ini? Hitung saja berapa kali kita membandingkan:

```python
langkah = 0
for i in range(len(rak)):
    langkah += 1
    if rak[i] == dicari:
        break
```

Kalau paketnya ada di rak 3, perlu 3 langkah. Kalau paketnya tidak ada, **semua** rak diperiksa. Jadi untuk `n` paket, paling beruntung 1 langkah dan paling sial `n` langkah. Dengan 1.000 paket, satu pencarian bisa memakan 1.000 langkah.

## Mengumpulkan semua yang cocok

Kalau yang dicari bisa lebih dari satu, misalnya semua paket ke Bandung, jangan pakai `break`. Periksa sampai habis dan kumpulkan nomor raknya ke sebuah list.

Untuk mencetak list teks dalam satu baris, pakai `join`:

```python
nomor = ["1", "3", "5"]
print(" ".join(nomor))   # 1 3 5
```

`join` hanya menerima teks, jadi ubah angka dengan `str()` sebelum dimasukkan ke list.
