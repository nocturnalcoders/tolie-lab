---
title: "Proyek: laporan harian"
---
Saatnya menggabungkan semuanya. Setiap malam mesin kasir mengeluarkan baris-baris mentah berformat `pelanggan,menu,jumlah`, dan Bu Rina ingin satu laporan singkat: berapa transaksi yang sah, berapa omzetnya, berapa pelanggan yang datang, dan menu apa yang terlaris.

## Rencana

Program besar lebih mudah ditulis kalau dipecah menjadi langkah kecil:

1. **Urai** setiap baris menjadi catatan, atau tandai sebagai rusak.
2. **Kumpulkan** angka dari catatan yang sah.
3. **Urutkan** lalu **cetak** hasilnya.

Harga tidak ada di baris data. Ia diambil dari daftar harga:

```python
HARGA = {"kopi susu": 15000, "teh tarik": 12000, "roti bakar": 18000, "es jeruk": 10000}
```

Nama dengan huruf besar semua adalah kebiasaan untuk data tetap yang dipakai di seluruh program.

## None sebagai tanda "tidak ada"

Fungsi pengurai mengembalikan dictionary untuk baris yang sah. Untuk baris yang rusak, ia mengembalikan `None`, dan pemanggil memeriksanya dengan `is None`:

```python
catatan = urai(baris)
if catatan is None:
    rusak += 1
else:
    sah += 1
```

Sebuah baris rusak jika kolomnya bukan tiga, jumlahnya bukan angka, jumlahnya 0 atau kurang, atau menunya tidak ada di `HARGA`.

## Mengurutkan dengan dua aturan

Peringkat omzet diurutkan dari yang terbesar. Kalau ada yang sama, urutannya menurut abjad supaya hasilnya selalu sama. Caranya, `key` mengembalikan **dua nilai** dalam kurung:

```python
def urutan(pasangan):
    nama, nilai = pasangan
    return (-nilai, nama)

omzet = {"teh tarik": 60000, "roti bakar": 90000, "kopi susu": 60000}
for nama, nilai in sorted(omzet.items(), key=urutan):
    print(nama, nilai)
```

Python membandingkan nilai pertama dulu, dan baru melihat nilai kedua kalau yang pertama sama. Tanda minus membuat angka terbesar menjadi yang paling kecil, sehingga tampil paling atas. Hasilnya `roti bakar`, `kopi susu`, lalu `teh tarik`.

Setelah pelajaran ini kamu sudah bisa mengubah data mentah menjadi laporan, pekerjaan yang setiap hari dilakukan dengan Python di banyak kantor.
