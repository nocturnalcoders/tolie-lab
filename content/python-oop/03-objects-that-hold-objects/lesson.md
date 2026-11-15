---
title: Objek yang menyimpan objek
---
Satu pesanan di Warung Kopi Senja berisi beberapa menu, masing-masing dengan jumlahnya. Atribut sebuah objek boleh berisi apa saja, termasuk list dan objek lain. Dari sinilah kelas-kelas kecil mulai bekerja sama.

## Satu baris pesanan

```python
class BarisPesanan:
    def __init__(self, item, jumlah):
        self.item = item        # sebuah objek ItemMenu
        self.jumlah = jumlah

    def subtotal(self):
        return self.item.harga * self.jumlah
```

`self.item.harga` dibaca dari kiri: ambil `item` milik baris ini, lalu ambil `harga` milik item itu.

## Pesanan menyimpan banyak baris

```python
class Pesanan:
    def __init__(self, pelanggan):
        self.pelanggan = pelanggan
        self.baris = []

    def tambah(self, item, jumlah):
        self.baris.append(BarisPesanan(item, jumlah))

    def total(self):
        hasil = 0
        for b in self.baris:
            hasil += b.subtotal()
        return hasil
```

List kosong dibuat di dalam `__init__`, jadi setiap pesanan punya list-nya sendiri. `total` tidak menghitung harga dikali jumlah sendiri. Ia cukup bertanya ke setiap baris lewat `b.subtotal()`. Setiap kelas mengurus bagiannya masing-masing.

## Memakainya

```python
kopi = ItemMenu("kopi susu", 15000)
roti = ItemMenu("roti bakar", 18000)

p = Pesanan("Siti")
p.tambah(kopi, 2)
p.tambah(roti, 1)

print(len(p.baris))            # 2
print(p.baris[0].item.nama)    # kopi susu
print(p.total())               # 48000
```

Kode yang memakai `Pesanan` tidak perlu tahu bagaimana baris disimpan. Ia cukup memanggil `tambah` dan `total`. Kalau nanti cara menyimpannya berubah, hanya isi kelas yang perlu disentuh.
