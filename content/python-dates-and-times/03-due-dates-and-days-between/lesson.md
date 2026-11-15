---
title: Jatuh tempo dan selisih hari
---
Pemasok kopi memberi tempo 30 hari untuk setiap tagihan. Tagihan bertanggal 20 Januari jatuh tempo kapan? Menghitungnya di kalender mudah keliru, karena panjang bulan berbeda-beda dan ada tahun kabisat. Python menghitungnya dengan `timedelta`.

## timedelta: rentang waktu

`date` adalah satu titik di kalender. `timedelta` adalah **jarak** antara dua titik.

```python
from datetime import date, timedelta

tagihan = date(2025, 1, 20)
jatuh_tempo = tagihan + timedelta(days=30)
print(jatuh_tempo)   # 2025-02-19
```

Pergantian bulan dan tahun diurus Python:

```python
print(date(2024, 12, 20) + timedelta(days=14))   # 2025-01-03
print(date(2024, 2, 28) + timedelta(days=1))     # 2024-02-29
```

Mundur juga bisa, misalnya untuk pengingat tiga hari sebelum jatuh tempo:

```python
pengingat = jatuh_tempo - timedelta(days=3)
print(pengingat)   # 2025-02-16
```

Untuk hitungan minggu ada `timedelta(weeks=2)`, sama dengan 14 hari.

## Selisih dua tanggal

Tanggal dikurangi tanggal menghasilkan `timedelta`. Banyaknya hari ada di `.days`:

```python
hari_ini = date(2025, 3, 14)
jatuh_tempo = date(2025, 3, 10)

selisih = hari_ini - jatuh_tempo
print(selisih.days)   # 4
```

Urutan pengurangan menentukan tandanya. Jika dibalik, hasilnya negatif:

```python
print((jatuh_tempo - hari_ini).days)   # -4
```

## Terlambat atau belum?

Dengan `sisa = (jatuh_tempo - hari_ini).days` ada tiga kemungkinan:

```python
if sisa < 0:
    print(f"Terlambat {-sisa} hari")
elif sisa == 0:
    print("Jatuh tempo hari ini")
else:
    print(f"Sisa {sisa} hari")
```

`-sisa` membalik tanda, sehingga `-4` ditampilkan sebagai `4`.

## Yang tidak bisa

Dua tanggal tidak bisa dijumlahkan, karena "14 Maret ditambah 10 Maret" tidak punya arti. Yang masuk akal hanya:

- tanggal ± rentang → tanggal
- tanggal − tanggal → rentang
