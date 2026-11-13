---
title: Struk belanja
---
Setiap pembeli minta struk. Kita perlu menggabungkan teks dan angka menjadi satu kalimat yang rapi.

## Tipe data

| Tipe | Contoh | Dipakai untuk |
| --- | --- | --- |
| `str` | `"Kopi Susu"` | teks |
| `int` | `15000` | angka bulat |
| `float` | `4.5` | angka desimal |

Tanya Python tipenya dengan `type`:

```python
print(type("Kopi"))   # <class 'str'>
print(type(15000))    # <class 'int'>
```

## f-string

Awali teks dengan `f` dan taruh nilai di dalam kurung kurawal:

```python
nama = "Budi"
jumlah = 2
print(f"{nama} membeli {jumlah} cangkir")
```

Hasilnya:

```
Budi membeli 2 cangkir
```

Di dalam kurung kurawal boleh ada hitungan, misalnya `{harga * jumlah}`.

## Struk

Struk yang kita mau terlihat seperti ini:

```
Struk untuk Budi
2 x Kopi Susu @ Rp15000
Total: Rp30000
```
