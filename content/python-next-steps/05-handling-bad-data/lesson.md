---
title: Menangani data yang salah
---
Suatu sore program Bu Rina berhenti di tengah jalan. Penyebabnya satu baris: kasir mengetik `dua` di kolom jumlah. Satu salah ketik tidak boleh menggagalkan laporan seharian.

## Error menghentikan program

```python
jumlah = int("dua")
```

Python berhenti dan menampilkan `ValueError: invalid literal for int()`. Nama di depan, `ValueError`, adalah **jenis** errornya: nilainya tidak bisa diubah menjadi angka.

## try dan except

Taruh kode yang bisa gagal di dalam `try`. Kalau error terjadi, Python melompat ke `except` dan program tetap berjalan:

```python
teks = input()
try:
    jumlah = int(teks)
    print(f"Jumlah: {jumlah}")
except ValueError:
    print("Bukan angka")
print("Selesai")
```

Untuk masukan `dua`, tampil `Bukan angka` lalu `Selesai`. Sisa blok `try` setelah baris yang gagal tidak dijalankan.

Selalu sebut jenis errornya. `except:` tanpa nama menelan semua error, termasuk salah ketik di kodemu sendiri, sehingga kesalahan jadi sulit ditemukan.

## Angka yang sah tetapi tidak masuk akal

`int("-4")` berhasil, padahal jumlah pesanan tidak mungkin negatif. Pemeriksaan seperti ini tetap memakai `if`:

```python
if jumlah <= 0:
    print("Jumlah harus lebih dari 0")
```

## Melewati baris yang rusak

Di dalam perulangan, catat baris yang rusak lalu lanjut ke baris berikutnya:

```python
rusak = 0
for _ in range(n):
    try:
        nama, jumlah, harga = input().split(",")
        total += int(jumlah) * int(harga)
    except ValueError:
        rusak += 1
```

Baris yang kolomnya kurang, misalnya `roti bakar,2`, juga menimbulkan `ValueError`, karena dua potongan tidak bisa dibagikan ke tiga nama. Jadi satu `except` menangkap keduanya.
