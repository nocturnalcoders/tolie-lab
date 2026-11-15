---
title: Membaca dan menulis tanggal
---
Tagihan dari pemasok menulis tanggal seperti `14/03/2025`, sedangkan mesin kasir menulis `2025-03-14`. Supaya bisa dihitung, teks itu harus diubah menjadi tanggal sungguhan. Sebaliknya, tanggal perlu ditulis kembali dalam format yang enak dibaca.

## Dari teks menjadi tanggal: strptime

```python
from datetime import datetime

teks = "14/03/2025"
tanggal = datetime.strptime(teks, "%d/%m/%Y").date()
print(tanggal)   # 2025-03-14
```

Argumen kedua adalah **pola** yang menjelaskan bentuk teksnya. Kode yang paling sering dipakai:

| Kode | Arti | Contoh |
| --- | --- | --- |
| `%d` | hari, dua digit | `14` |
| `%m` | bulan, dua digit | `03` |
| `%Y` | tahun, empat digit | `2025` |
| `%H` | jam (00 sampai 23) | `08` |
| `%M` | menit | `30` |

Huruf besar dan kecil berbeda arti: `%m` bulan, `%M` menit. Tanda di antaranya (`/`, `-`, spasi) harus sama persis dengan teksnya.

`strptime` menghasilkan `datetime`, yaitu tanggal beserta jam. Tambahkan `.date()` untuk mengambil tanggalnya saja.

## Teks yang salah

Kalau teks tidak cocok dengan pola, atau tanggalnya tidak ada, muncul `ValueError`. Tangkap dengan try/except seperti di kursus sebelumnya:

```python
try:
    tanggal = datetime.strptime("30/02/2025", "%d/%m/%Y").date()
except ValueError:
    print("Tanggal tidak sah")
```

## Dari tanggal menjadi teks: strftime

Kebalikannya, `strftime` menulis tanggal mengikuti pola:

```python
from datetime import date

shift = date(2025, 3, 5)
print(shift.strftime("%d/%m/%Y"))   # 05/03/2025
print(shift.strftime("%Y-%m"))      # 2025-03
```

## Nama hari dan bulan

`strftime` punya kode untuk nama hari dan nama bulan, tetapi hasilnya bergantung pada pengaturan bahasa komputer yang menjalankan program. Supaya hasilnya selalu sama, pakai kode angka saja dan ambil nama dari list sendiri:

```python
HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

print(f"{HARI[shift.weekday()]}, {shift.strftime('%d/%m/%Y')}")
# Rabu, 05/03/2025
```
