---
title: Menjaga data tetap benar
---
Sejauh ini tidak ada yang menghalangi `ItemMenu("kopi susu", -5000)`. Harga negatif itu akan ikut terhitung di setiap struk. Objek yang baik menolak data yang tidak masuk akal sejak awal.

## Menolak dengan raise

Di Python Lanjutan kamu **menangkap** `ValueError`. Sekarang kamu yang **memunculkannya**:

```python
class ItemMenu:
    def __init__(self, nama, harga):
        if harga <= 0:
            raise ValueError("Harga harus lebih dari 0")
        self.nama = nama
        self.harga = harga
```

`raise` langsung menghentikan metode dan mengirim error ke kode yang memanggilnya. Objeknya tidak jadi dibuat.

## Menangkapnya di luar kelas

```python
try:
    item = ItemMenu("kopi susu", -5000)
    print("Tersimpan")
except ValueError as e:
    print(f"Ditolak: {e}")
```

Tampil `Ditolak: Harga harus lebih dari 0`. Bagian `as e` menyimpan errornya di variabel `e`, dan saat dicetak yang muncul adalah pesannya. Kelas memutuskan **apa yang salah**, pemanggil memutuskan **apa yang dilakukan**.

## Menjaga perubahan

Pemeriksaan yang sama berlaku di metode yang mengubah data:

```python
class StokMenu:
    def __init__(self, nama, stok):
        self.nama = nama
        self.stok = stok

    def jual(self, jumlah):
        if jumlah > self.stok:
            raise ValueError("Stok tidak cukup")
        self.stok -= jumlah
```

Periksa dulu, ubah belakangan. Kalau permintaan ditolak, `stok` tidak tersentuh.

## Property: nilai yang dihitung

```python
    @property
    def habis(self):
        return self.stok == 0
```

`@property` membuat metode dibaca seperti atribut, tanpa kurung: `roti.habis`. Nilainya dihitung setiap kali dibaca, jadi tidak pernah ketinggalan dari `stok`. Karena tidak bisa diisi langsung (`roti.habis = True` ditolak Python), nilainya juga tidak bisa dibuat salah.
