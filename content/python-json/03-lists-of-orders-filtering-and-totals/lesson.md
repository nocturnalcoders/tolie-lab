---
title: "Daftar pesanan: menyaring dan menjumlahkan"
---
Setiap malam AntarMakan mengirim semua pesanan hari itu sekaligus. Bentuknya daftar JSON: kurung siku yang berisi banyak objek.

```json
[
  {"id": "AM-1021", "status": "selesai", "total": 68000},
  {"id": "AM-1022", "status": "batal", "total": 22000},
  {"id": "AM-1023", "status": "selesai", "total": 50000}
]
```

`json.loads` mengubahnya menjadi list of dictionary. Daftar kosong `[]` menjadi list kosong, dan perulangan di atasnya tidak berjalan sama sekali, tanpa error.

```python
import json

daftar = json.loads(input())
print(len(daftar))   # 3
```

## Menyaring sambil menjumlahkan

Pesanan yang batal tidak menghasilkan uang. Jadi sebelum menjumlahkan, saring dulu dengan `if`:

```python
omzet = 0
selesai = 0
for pesanan in daftar:
    if pesanan["status"] == "selesai":
        selesai += 1
        omzet += pesanan["total"]
print(selesai, omzet)   # 2 118000
```

Polanya selalu sama: siapkan wadah sebelum perulangan, periksa syaratnya di dalam, dan cetak hasilnya setelah perulangan selesai.

## Daftar di dalam daftar

Kalau setiap pesanan membawa daftar `item`, pakai perulangan di dalam perulangan. Hitungan per menu disimpan di dictionary dengan pola `.get(kunci, 0)`:

```python
terjual = {}
for pesanan in daftar:
    if pesanan["status"] != "selesai":
        continue
    for item in pesanan["item"]:
        menu = item["menu"]
        terjual[menu] = terjual.get(menu, 0) + item["jumlah"]
```

`continue` melompat ke pesanan berikutnya, sehingga pesanan batal tidak ikut dihitung.

## Urutan yang pasti

Supaya hasilnya selalu sama, cetak menurut abjad dengan `sorted`:

```python
for menu in sorted(terjual):
    print(f"{menu}: {terjual[menu]}")
```

Dictionary yang kosong bernilai salah di dalam `if`, jadi `if not terjual:` berarti "belum ada yang terjual".
