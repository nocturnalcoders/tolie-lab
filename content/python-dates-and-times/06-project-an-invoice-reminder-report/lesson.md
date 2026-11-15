---
title: "Proyek: laporan pengingat tagihan"
---
Setiap Jumat pagi Bu Rina membuka laci tagihan dan bertanya: mana yang sudah terlambat, mana yang harus dibayar minggu ini, dan berapa uang yang perlu disiapkan? Di pelajaran terakhir ini kita menyusun laporan yang menjawab ketiganya, memakai semua yang sudah dipelajari.

## Datanya

Bu Rina mengetik satu baris per tagihan: pemasok, tanggal tagihan, tempo dalam hari, dan jumlahnya.

```
Kopi Gayo Jaya,12/02/2025,30,1250000
Roti Makmur,24/02/2025,14,450000
```

Karena diketik tangan, ada baris yang rusak.

## Langkah 1: satu baris menjadi satu catatan

Fungsi `urai` mengubah satu baris menjadi dictionary, atau `None` jika barisnya rusak. `strptime` dan `int` sama-sama memunculkan `ValueError`, jadi satu `try` menangkap semuanya:

```python
from datetime import datetime, timedelta

def urai(baris):
    try:
        pemasok, teks, tempo, jumlah = baris.split(",")
        tagihan = datetime.strptime(teks.strip(), "%d/%m/%Y").date()
        tempo = int(tempo)
        jumlah = int(jumlah)
    except ValueError:
        return None
    ...
```

Yang disimpan di catatan bukan tanggal tagihan, melainkan **jatuh temponya**: `tagihan + timedelta(days=tempo)`. Itulah tanggal yang dipakai semua langkah berikutnya.

## Langkah 2: status setiap tagihan

"Hari ini" dibaca dari baris pertama input, lalu dibandingkan dengan jatuh tempo seperti di pelajaran 3:

```python
sisa = (t["jatuh_tempo"] - hari_ini).days
```

## Langkah 3: urutkan

Tagihan yang paling mendesak harus di atas. Fungsi kunci mengembalikan tuple, sehingga tagihan dengan jatuh tempo yang sama diurutkan menurut nama pemasok:

```python
def urutan(t):
    return (t["jatuh_tempo"], t["pemasok"])

for t in sorted(daftar, key=urutan):
    ...
```

## Langkah 4: ringkasan

Sambil mencetak, kumpulkan dua angka: jumlah tagihan yang terlambat, dan jumlah uang untuk tagihan yang jatuh tempo dalam 7 hari ke depan:

```python
if sisa < 0:
    terlambat += 1
    uang_terlambat += t["jumlah"]
elif sisa <= 7:
    minggu_ini += t["jumlah"]
```

Cabang `elif` hanya diperiksa jika `sisa` tidak negatif, jadi `sisa <= 7` berarti 0 sampai 7.
