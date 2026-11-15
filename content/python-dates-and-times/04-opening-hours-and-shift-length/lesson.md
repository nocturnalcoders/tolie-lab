---
title: Jam buka dan lama shift
---
Tanggal saja belum cukup untuk jadwal shift. Siti masuk pukul 14:30 dan pulang pukul 22:15, dan warung buka dari pukul 07:00. Untuk itu ada dua tipe lagi: `datetime` (tanggal beserta jam) dan `time` (jam saja).

## datetime: tanggal beserta jam

```python
from datetime import datetime

masuk = datetime(2025, 3, 14, 14, 30)
print(masuk)          # 2025-03-14 14:30:00
print(masuk.hour)     # 14
print(masuk.minute)   # 30
```

Dari teks, pakai `strptime` dengan kode `%H` dan `%M`:

```python
masuk = datetime.strptime("2025-03-14 14:30", "%Y-%m-%d %H:%M")
```

Sebuah `datetime` bisa dipecah menjadi dua bagian, dan tetap punya `.weekday()`:

```python
print(masuk.date())   # 2025-03-14
print(masuk.time())   # 14:30:00
```

## time: jam saja

Jam buka warung sama setiap hari, jadi tidak perlu tanggal:

```python
from datetime import time

buka = time(7, 0)
tutup = time(21, 0)
sekarang = masuk.time()

print(buka <= sekarang < tutup)    # True
print(tutup.strftime("%H:%M"))     # 21:00
```

Jam bisa dibandingkan seperti angka. Perhatikan `< tutup`: tepat pukul 21:00 warung sudah tutup.

## Lama shift

`datetime` dikurangi `datetime` menghasilkan `timedelta`, sama seperti tanggal:

```python
masuk = datetime(2025, 3, 14, 14, 30)
pulang = datetime(2025, 3, 14, 22, 15)

lama = pulang - masuk
menit = int(lama.total_seconds()) // 60
print(menit)   # 465
```

`.total_seconds()` memberi seluruh rentang dalam detik. Pecah menit menjadi jam dan sisanya dengan `//` dan `%`:

```python
print(f"{menit // 60} jam {menit % 60} menit")   # 7 jam 45 menit
```

Karena tanggalnya ikut dihitung, shift malam yang melewati tengah malam tetap benar. Dari 31 Desember pukul 20:00 sampai 1 Januari pukul 02:30 hasilnya 6 jam 30 menit.

## Menambah jam

`timedelta` juga menerima `hours` dan `minutes`:

```python
from datetime import timedelta

selesai = masuk + timedelta(hours=8)
print(selesai)   # 2025-03-14 22:30:00
```
