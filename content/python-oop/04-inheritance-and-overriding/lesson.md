---
title: Pewarisan dan menimpa metode
---
Minuman di Warung Kopi Senja bisa dipesan ukuran besar dengan tambahan Rp3000. Makanan tidak punya ukuran. Menyalin seluruh kelas `ItemMenu` hanya untuk satu perbedaan itu membuat kode sulit dirawat. **Pewarisan** membuat kelas baru yang mengambil semua isi kelas lama, lalu mengubah yang perlu saja.

## Kelas induk

```python
class ItemMenu:
    def __init__(self, nama, harga):
        self.nama = nama
        self.harga = harga

    def harga_jual(self):
        return self.harga

    def __str__(self):
        return f"{self.nama}: Rp{self.harga_jual()}"
```

## Kelas turunan

```python
class Minuman(ItemMenu):
    def __init__(self, nama, harga, ukuran):
        super().__init__(nama, harga)
        self.ukuran = ukuran

    def harga_jual(self):
        if self.ukuran == "besar":
            return self.harga + 3000
        return self.harga
```

Nama di dalam kurung, `ItemMenu`, adalah **kelas induk**. `Minuman` mewarisi semua metodenya. Dua hal baru di sini:

- `super().__init__(nama, harga)` menjalankan `__init__` milik induk, supaya `nama` dan `harga` tersimpan tanpa ditulis ulang. Setelah itu barulah atribut tambahan diisi.
- `harga_jual` ditulis lagi dengan isi berbeda. Ini disebut **menimpa** (*override*): untuk objek `Minuman`, versi inilah yang dipakai.

## Satu cara pakai, perilaku berbeda

```python
daftar = [Minuman("kopi susu", 15000, "besar"), ItemMenu("roti bakar", 18000)]
for item in daftar:
    print(item)
```

```
kopi susu: Rp18000
roti bakar: Rp18000
```

`Minuman` tidak punya `__str__` sendiri, jadi yang jalan adalah `__str__` warisan. Di dalamnya, `self.harga_jual()` memanggil versi milik objek yang sedang dicetak. Kode yang mengulang daftar tidak perlu `if` untuk membedakan jenisnya.

Kelas turunan yang isinya hanya `pass` berperilaku persis seperti induknya.
