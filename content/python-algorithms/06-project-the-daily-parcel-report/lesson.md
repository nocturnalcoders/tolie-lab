---
title: "Proyek: laporan paket harian"
---
Setiap sore Pak Darto butuh dua hal: **rekap** paket yang masuk hari itu, dan cara cepat menjawab pelanggan yang menanyakan resinya. Semua bahannya sudah kamu punya. Sekarang tinggal merangkainya.

## Rekap: satu kali jalan

Data masuk sebagai baris `resi,kota,berat`. Menghitung paket per kota, menjumlah berat, dan melacak paket terberat bisa dilakukan sekaligus dalam satu perulangan:

```python
per_kota = {}
total_berat = 0
for p in paket:
    per_kota[p["kota"]] = per_kota.get(p["kota"], 0) + 1
    total_berat += p["berat"]
```

Untuk mengurutkan kota dari yang paling ramai, dan menurut abjad kalau jumlahnya sama, pakai `sorted` dengan `key` yang mengembalikan dua nilai:

```python
def urutan(pasangan):
    kota, jumlah = pasangan
    return (-jumlah, kota)

for kota, jumlah in sorted(per_kota.items(), key=urutan):
    print(kota, jumlah)
```

## Lacak: urutkan sekali, cari berkali-kali

Paket datang dalam urutan acak, padahal pencarian biner butuh data terurut. Maka urutkan **sekali** dengan `sorted`, lalu pakai hasilnya untuk semua pertanyaan hari itu.

Fungsi pencari perlu mengembalikan dua hal: hasilnya dan jumlah langkahnya. Sebuah fungsi boleh mengembalikan list, dan pemanggilnya membongkarnya ke dua variabel:

```python
def cari(data, dicari):
    langkah = 0
    # ... pencarian biner ...
    return [kota, langkah]

kota, langkah = cari(data, 1042)
```

## Catatan tentang efisiensi

Mengapa repot mengurutkan dulu? Bayangkan 1.000 paket dan 500 pertanyaan sehari.

- **Satu per satu**: tiap pertanyaan bisa memakan 1.000 langkah, jadi sampai 500.000 langkah sehari.
- **Urutkan lalu membagi dua**: mengurutkan sekali sekitar 10.000 langkah, lalu tiap pertanyaan paling banyak 10 langkah. Totalnya sekitar 15.000.

Aturan praktisnya: pekerjaan yang langkahnya **tumbuh seiring `n`** terasa berat saat diulang berkali-kali, sedangkan pekerjaan yang **membagi dua** hampir tidak terasa. Kalau hanya ada satu pertanyaan, mengurutkan dulu justru rugi. Jadi sebelum memilih cara, tanyakan: seberapa besar datanya, dan seberapa sering pekerjaan ini diulang?
