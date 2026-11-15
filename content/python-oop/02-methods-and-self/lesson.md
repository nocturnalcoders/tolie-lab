---
title: Metode dan self
---
Objek `ItemMenu` sudah menyimpan data. Sekarang kita beri ia kemampuan: menghitung dan menampilkan dirinya sendiri. Fungsi yang ditulis di dalam kelas disebut **metode**.

## Metode: fungsi milik objek

```python
class ItemMenu:
    def __init__(self, nama, harga):
        self.nama = nama
        self.harga = harga

    def subtotal(self, jumlah):
        return self.harga * jumlah


kopi = ItemMenu("kopi susu", 15000)
print(kopi.subtotal(2))   # 30000
```

Parameter pertama setiap metode adalah `self`. Saat kamu menulis `kopi.subtotal(2)`, Python mengisi `self` dengan `kopi` dan `jumlah` dengan `2`. Lewat `self`, metode membaca data objeknya sendiri, jadi harga tidak perlu dikirim lagi.

## Metode yang mengubah objek

```python
    def naikkan(self, tambahan):
        self.harga = self.harga + tambahan
```

```python
kopi.naikkan(1000)
print(kopi.harga)   # 16000
```

Metode ini tidak mengembalikan apa-apa. Ia mengubah atribut, dan perubahannya tetap tersimpan di objek.

## Menampilkan objek dengan `__str__`

Coba `print(kopi)`. Hasilnya kurang berguna: `<__main__.ItemMenu object at 0x...>`. Python tidak tahu cara menulis sebuah menu sampai kamu memberitahunya lewat metode khusus `__str__`:

```python
    def __str__(self):
        return f"{self.nama} (Rp{self.harga})"
```

```python
print(kopi)              # kopi susu (Rp16000)
print(f"Pesan: {kopi}")  # Pesan: kopi susu (Rp16000)
```

Dua hal yang sering terlewat:

- `__str__` harus **mengembalikan** teks dengan `return`, bukan mencetaknya dengan `print`.
- Lupa menulis `self` di daftar parameter membuat pemanggilan gagal dengan `TypeError`, karena Python tetap mengirim objeknya sebagai argumen pertama.
