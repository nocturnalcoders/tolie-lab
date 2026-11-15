---
title: Data bersarang dan .get
---
Pesanan sungguhan dari AntarMakan tidak sesederhana satu baris data. Satu pesanan bisa berisi beberapa menu, dan data pelanggannya punya bagian sendiri:

```json
{
  "id": "AM-1021",
  "pelanggan": {"nama": "Dewi", "kota": "Bandung"},
  "item": [
    {"menu": "nasi rendang", "jumlah": 2, "harga": 28000},
    {"menu": "es teh manis", "jumlah": 2, "harga": 6000}
  ]
}
```

Nilai sebuah kunci boleh berupa objek lain (`{}`) atau daftar (`[]`). Inilah yang disebut data **bersarang**. Aplikasi mengirimnya dalam satu baris panjang. Di sini ditulis berbaris-baris hanya supaya enak dibaca.

## Menelusuri selangkah demi selangkah

Setelah `json.loads`, objek menjadi dictionary dan daftar menjadi list. Ambil nilainya selapis demi selapis:

```python
pesanan = json.loads(input())
print(pesanan["pelanggan"]["nama"])      # Dewi
print(pesanan["item"][0]["menu"])        # nasi rendang
print(len(pesanan["item"]))              # 2
```

Daftar item diulang dengan `for`, sama seperti list of dictionary yang sudah kamu kenal:

```python
for item in pesanan["item"]:
    print(item["menu"], item["jumlah"] * item["harga"])
```

## Kunci yang kadang tidak ada

Aplikasi tidak selalu mengirim semua kunci. Pesanan yang belum mendapat kurir, misalnya, tidak punya bagian `pengiriman`. Mengambil kunci yang tidak ada dengan kurung siku menghentikan program dengan `KeyError`.

`.get` lebih aman, karena mengembalikan nilai cadangan saat kuncinya tidak ada:

```python
catatan = pesanan.get("catatan", "-")
```

Untuk data bersarang, pakai `{}` sebagai cadangan lapis pertama, supaya `.get` berikutnya tetap bisa dijalankan:

```python
pengiriman = pesanan.get("pengiriman", {})
ongkir = pengiriman.get("ongkir", 0)
```

Kalau `pengiriman` tidak ada, `ongkir` menjadi `0` dan program tetap berjalan.
