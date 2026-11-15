---
title: "Proyek: kasir mini"
---
Saatnya merakit semua yang sudah kamu pelajari menjadi kasir kecil untuk Warung Kopi Senja. Tidak ada sintaks baru di pelajaran ini. Yang baru adalah cara membagi pekerjaan ke beberapa kelas.

## Siapa mengurus apa

- `ItemMenu` tahu nama dan harganya sendiri.
- `Menu` menyimpan semua item dan tahu cara mencarinya.
- `BarisPesanan` tahu subtotalnya.
- `Pesanan` menyimpan baris-barisnya, menolak jumlah yang salah, menghitung total, dan mencetak struk.

Setiap kelas kecil dan punya satu tugas. Kalau struk salah, kamu tahu harus membuka kelas yang mana.

## Menu: dictionary yang dibungkus kelas

```python
class Menu:
    def __init__(self):
        self.daftar = {}

    def tambah(self, item):
        self.daftar[item.nama] = item

    def cari(self, nama):
        kunci = nama.strip().lower()
        if kunci not in self.daftar:
            raise ValueError(f"Menu tidak ada: {kunci}")
        return self.daftar[kunci]
```

Nama menu menjadi kunci, objeknya menjadi nilai. `cari` merapikan ketikan kasir lebih dulu, jadi ` Kopi Susu ` tetap ditemukan. Kalau menunya memang tidak ada, `cari` tidak mengembalikan `None` secara diam-diam. Ia memunculkan `ValueError` yang menyebut nama yang dicari.

## Program utamanya jadi pendek

```python
pesanan = Pesanan("Siti")
for nama, jumlah in [("kopi susu", 2), ("nasi goreng", 1), ("roti bakar", 1)]:
    try:
        pesanan.tambah(menu.cari(nama), jumlah)
    except ValueError as e:
        print(f"Dilewati: {e}")
pesanan.cetak()
```

```
Dilewati: Menu tidak ada: nasi goreng
== Struk Siti ==
2 x kopi susu = Rp30000
1 x roti bakar = Rp18000
Total: Rp48000
```

Satu `except` menangkap dua macam penolakan: menu yang tidak ada (dari `Menu.cari`) dan jumlah yang salah (dari `Pesanan.tambah`). Program utama tidak perlu tahu aturan mana yang dilanggar. Ia hanya mencetak pesannya, lalu lanjut ke baris berikutnya.
