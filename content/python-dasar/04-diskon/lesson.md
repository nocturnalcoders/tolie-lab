---
title: Diskon dengan if dan else
---
Bu Rina punya aturan baru: **belanja Rp100.000 atau lebih dapat diskon 10%**. Program sekarang harus bisa mengambil keputusan.

## Perbandingan

Perbandingan menghasilkan `True` atau `False`:

| Tulisan | Artinya |
| --- | --- |
| `a == b` | sama dengan |
| `a != b` | tidak sama dengan |
| `a > b` | lebih besar |
| `a >= b` | lebih besar atau sama |
| `a < b` | lebih kecil |
| `a <= b` | lebih kecil atau sama |

Hati-hati: `=` menyimpan nilai, sedangkan `==` membandingkan.

## if, elif, else

```python
total = 120000

if total >= 100000:
    print("Dapat diskon")
else:
    print("Belum dapat diskon")
```

Baris di dalam `if` harus **menjorok** (empat spasi). Itulah cara Python tahu baris mana yang ikut. Untuk lebih dari dua pilihan, pakai `elif`:

```python
if jumlah >= 10:
    print("Besar")
elif jumlah >= 3:
    print("Sedang")
else:
    print("Kecil")
```

Python memeriksa dari atas dan berhenti di pilihan pertama yang benar.

## Menghitung persen

Diskon 10% berarti membayar 90%. Dengan bilangan bulat: `total * 90 // 100`.
