---
title: Rekap per tanggal dan per bulan
---
Buku penjualan Bu Rina berisi satu baris per setoran kasir: tanggal dan jumlah uangnya. Barisnya tidak selalu berurutan, dan satu tanggal bisa muncul beberapa kali. Bu Rina ingin rekap per tanggal dan per bulan, urut dari yang paling awal.

## Jangan mengurutkan teks tanggal

Teks diurutkan huruf demi huruf dari kiri, jadi tanggal berformat `hari/bulan/tahun` terurut salah:

```python
print(sorted(["05/02/2025", "20/01/2025"]))
# ['05/02/2025', '20/01/2025']   Februari sebelum Januari!
```

Ubah dulu menjadi `date`. Tanggal sungguhan terurut menurut kalender.

## Tanggal sebagai kunci dictionary

Pola hitungan dengan `.get` dari kursus sebelumnya tetap berlaku. Kuncinya sekarang sebuah `date`:

```python
from datetime import datetime

baris_data = ["14/03/2025,45000", "13/03/2025,30000", "14/03/2025,15000"]

omzet = {}
for baris in baris_data:
    teks, jumlah = baris.split(",")
    tanggal = datetime.strptime(teks, "%d/%m/%Y").date()
    omzet[tanggal] = omzet.get(tanggal, 0) + int(jumlah)
```

`sorted(omzet)` mengurutkan kuncinya, dari tanggal paling awal:

```python
for tanggal in sorted(omzet):
    print(tanggal.strftime("%d/%m/%Y"), omzet[tanggal])
# 13/03/2025 30000
# 14/03/2025 60000
```

## Mengelompokkan per bulan

Untuk rekap bulanan, kuncinya cukup tahun dan bulan. `strftime("%Y-%m")` membuat teks seperti `2025-03`:

```python
bulan = tanggal.strftime("%Y-%m")
per_bulan[bulan] = per_bulan.get(bulan, 0) + int(jumlah)
```

Teks berformat `tahun-bulan` aman diurutkan, karena bagian terbesar (tahun) ada di kiri dan bulannya selalu dua digit: `2024-12` datang sebelum `2025-01`.

## Mengurutkan catatan menurut tanggal

Kalau datanya berupa list dictionary, beri `sorted` fungsi kunci yang mengembalikan tanggalnya:

```python
from datetime import date

def menurut_tanggal(catatan):
    return catatan["tanggal"]

setoran = [
    {"tanggal": date(2025, 1, 1), "jumlah": 120000},
    {"tanggal": date(2024, 12, 31), "jumlah": 250000},
]
for s in sorted(setoran, key=menurut_tanggal):
    print(s["tanggal"], s["jumlah"])
# 2024-12-31 250000
# 2025-01-01 120000
```
