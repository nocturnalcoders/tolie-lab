---
title: Merapikan data pelanggan
---
Daftar pelanggan Warung Kopi Senja berantakan: ada yang diketik huruf besar semua, ada yang spasinya berlebih. Sebelum dipakai, datanya perlu dirapikan. Pekerjaan seperti ini sangat sering muncul di kantor.

## Metode teks

Teks punya banyak "metode", yaitu perintah yang ditulis setelah titik:

| Metode | Hasil untuk `"  siti aMINAH "` |
| --- | --- |
| `.strip()` | `"siti aMINAH"` (spasi di pinggir dibuang) |
| `.lower()` | `"  siti aminah "` |
| `.upper()` | `"  SITI AMINAH "` |
| `.title()` | `"  Siti Aminah "` |

Metode bisa dirangkai dari kiri ke kanan:

```python
nama = "  siti aMINAH "
print(nama.strip().title())
```

Hasilnya `Siti Aminah`.

## Memecah teks

`.split("@")` memecah teks di tanda tertentu dan menghasilkan **list** (daftar):

```python
email = "budi@gmail.com"
bagian = email.split("@")
print(bagian)      # ['budi', 'gmail.com']
print(bagian[1])   # gmail.com
```

Isi list dibaca dengan nomor urut yang dimulai dari `0`.
