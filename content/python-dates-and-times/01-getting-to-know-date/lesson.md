---
title: Mengenal tanggal dengan date
---
Bu Rina menempel jadwal shift di dinding Warung Kopi Senja dan menyimpan tagihan pemasok di laci. Keduanya penuh tanggal. Kalau tanggal hanya disimpan sebagai teks seperti `"14/03/2025"`, Python tidak tahu hari apa itu atau tanggal mana yang lebih dulu. Karena itu Python punya tipe khusus: `date`.

## Membuat tanggal

```python
from datetime import date

jatuh_tempo = date(2025, 3, 14)
print(jatuh_tempo)   # 2025-03-14
```

Urutannya selalu **tahun, bulan, hari**. Saat dicetak, tanggal tampil dalam format `tahun-bulan-hari` dengan bulan dan hari dua digit.

## Mengambil bagiannya

```python
print(jatuh_tempo.year)    # 2025
print(jatuh_tempo.month)   # 3
print(jatuh_tempo.day)     # 14
```

Ketiganya angka biasa, jadi bisa dihitung atau dibandingkan.

## Tanggal dari input

`input()` selalu memberi teks. Ubah dulu menjadi angka dengan `int`:

```python
tahun = int(input())
bulan = int(input())
hari = int(input())
shift = date(tahun, bulan, hari)
```

Python menolak tanggal yang tidak ada. `date(2025, 2, 30)` berhenti dengan `ValueError`, sedangkan `date(2024, 2, 29)` diterima karena 2024 tahun kabisat.

## Hari apa?

`.weekday()` mengembalikan angka: **0 untuk Senin** sampai 6 untuk Minggu.

```python
print(date(2025, 3, 14).weekday())   # 4
```

Angka itu cocok dipakai sebagai indeks list nama hari buatan sendiri:

```python
HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

shift = date(2025, 3, 14)
print(HARI[shift.weekday()])   # Jumat
```

Dengan list sendiri, nama hari selalu tampil dalam bahasa yang kita mau, di komputer mana pun programnya dijalankan.

## Membandingkan tanggal

Tanggal bisa dibandingkan seperti angka. Yang lebih awal dianggap lebih kecil:

```python
print(date(2024, 12, 31) < date(2025, 1, 1))   # True
```

## Catatan penting

Di kursus ini "hari ini" selalu dibaca dari input, bukan diambil dari jam komputer. Dengan begitu program memberi hasil yang sama kapan pun dijalankan, dan mudah diuji.
