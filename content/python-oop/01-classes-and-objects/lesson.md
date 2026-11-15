---
title: Kelas dan objek
---
Di kursus sebelumnya satu menu disimpan sebagai dictionary: `{"nama": "kopi susu", "harga": 15000}`. Cara itu berjalan, tetapi tidak ada yang menjamin setiap dictionary punya kunci yang sama. Salah ketik `"hrga"` baru ketahuan saat program berhenti di tengah jalan. **Kelas** memberi setiap menu bentuk yang pasti.

## Kelas adalah cetakan

```python
class ItemMenu:
    def __init__(self, nama, harga):
        self.nama = nama
        self.harga = harga
```

Kelas baru sebuah cetakan: belum ada satu menu pun. Nama kelas biasanya ditulis dengan huruf besar di awal setiap kata.

## Objek dibuat dari cetakan

```python
kopi = ItemMenu("kopi susu", 15000)
teh = ItemMenu("teh tarik", 12000)

print(kopi.nama)   # kopi susu
print(teh.harga)   # 12000
```

Memanggil nama kelas seperti memanggil fungsi akan membuat satu **objek**. Saat itu Python otomatis menjalankan `__init__` (dua garis bawah di depan dan di belakang). `self` adalah objek yang sedang dibuat, jadi kamu cukup mengirim `nama` dan `harga`.

Baris `self.nama = nama` menyimpan nilai ke dalam objek. Nilai yang menempel pada objek disebut **atribut**, dan dibaca dengan titik: `kopi.nama`.

## Setiap objek punya datanya sendiri

```python
kopi.harga = 16000

print(kopi.harga)  # 16000
print(teh.harga)   # 12000
```

`kopi` dan `teh` dibuat dari cetakan yang sama, tetapi mengubah yang satu tidak menyentuh yang lain.

## Objek di dalam list

Objek bisa dikumpulkan dalam list, sama seperti dictionary:

```python
daftar = [kopi, teh]
for m in daftar:
    print(f"{m.nama} - Rp{m.harga}")
```

Bedanya hanya cara mengambil isinya: `m.nama`, bukan `m["nama"]`. Kalau kamu salah mengetik nama atribut, Python langsung memberi tahu dengan `AttributeError`.
