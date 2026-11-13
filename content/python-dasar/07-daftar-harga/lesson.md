---
title: Daftar harga dengan dictionary
---
Harga menu tidak boleh tersebar di banyak tempat. Kita simpan di satu **dictionary**: kumpulan pasangan *kunci* dan *nilai*.

## Membuat dan membaca

```python
menu = {"kopi susu": 15000, "teh tarik": 12000}

print(menu["kopi susu"])   # 15000
```

Kunci di sebelah kiri titik dua, nilai di sebelah kanan. Membaca kunci yang tidak ada menimbulkan error `KeyError`.

## Memeriksa dan mengambil dengan aman

```python
if "es jeruk" in menu:
    print("Ada")
else:
    print("Belum ada")

print(menu.get("es jeruk", 0))   # 0, karena tidak ada
```

`.get(kunci, cadangan)` mengembalikan nilai cadangan bila kunci tidak ada, tanpa error.

## Menambah dan mengubah

```python
menu["roti bakar"] = 18000   # tambah
menu["kopi susu"] = 16000    # ubah harga
```

## Mengulang isi dictionary

```python
for nama, harga in menu.items():
    print(nama, harga)
```
