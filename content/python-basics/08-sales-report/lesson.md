---
title: Fungsi dan laporan penjualan
---
Di pelajaran terakhir kita menggabungkan semuanya. Pertama, merapikan kode dengan **fungsi**. Lalu membuat laporan penjualan yang benar-benar dipakai Bu Rina.

## Fungsi

Fungsi adalah blok kode bernama yang bisa dipanggil berulang kali:

```python
def hitung_bayar(total):
    if total >= 100000:
        return total * 90 // 100
    return total

print(hitung_bayar(250000))   # 225000
```

- `def` membuat fungsi, `total` adalah **parameter** (data yang masuk).
- `return` mengirim hasil ke pemanggil. Kode setelah `return` tidak dijalankan.
- Berbeda dengan `print`, `return` tidak menampilkan apa pun. Hasilnya dipakai oleh kode yang memanggil.

## Membaca baris berformat

Data penjualan datang sebagai baris `nama,jumlah,harga`. Pecah, lalu ubah angkanya:

```python
nama, jumlah, harga = "kopi susu,10,15000".split(",")
jumlah = int(jumlah)
harga = int(harga)
```

## Proyek: laporan penjualan

Baris pertama berisi banyaknya baris data. Tiap baris berikutnya `nama,jumlah,harga`. Laporan harus menunjukkan **total penjualan** dan **menu terlaris** (jumlah terjual terbanyak).
