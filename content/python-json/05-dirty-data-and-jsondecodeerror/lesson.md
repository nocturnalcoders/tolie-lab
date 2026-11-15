---
title: Data kotor dan JSONDecodeError
---
Suatu malam sinyal di dapur buruk, dan kiriman AntarMakan sampai dalam keadaan berantakan: satu baris terpotong, satu pesanan tanpa harga, satu lagi jumlahnya ditulis sebagai teks. Program yang baik tidak berhenti karena satu baris rusak.

## Teks yang bukan JSON

```python
import json

json.loads('{"id": "AM-1022", "total": 22000')
```

Kurung kurawal penutupnya hilang, jadi Python berhenti dengan `json.JSONDecodeError`. Hal yang sama terjadi untuk kutip tunggal (`{'id': 'AM-1023'}`) dan koma berlebih di akhir (`{"total": 5000,}`). Tangkap dengan `try` dan `except`:

```python
try:
    data = json.loads(teks)
except json.JSONDecodeError:
    print("bukan JSON")
```

## JSON yang sah, tetapi bukan objek

`[1, 2, 3]` dan `"AM-1040"` adalah JSON yang sah, hanya saja hasilnya list dan teks, bukan dictionary. `isinstance` memeriksa jenis sebuah nilai:

```python
if not isinstance(data, dict):
    print("bukan objek")
```

## Kunci yang wajib ada

Di pelajaran 2, `.get` memberi nilai cadangan. Namun untuk harga tidak ada cadangan yang masuk akal. Lebih baik pesanannya ditolak. Periksa dengan `in`:

```python
if "harga" not in data:
    print("kunci kurang")
```

## Jenis yang salah

Kadang aplikasi mengirim `"jumlah": "3"`, yaitu angka di dalam tanda kutip. `int()` memperbaikinya. Namun `int("dua")` menimbulkan `ValueError`, dan `int(None)` (dari `null`) menimbulkan `TypeError`. Satu `except` bisa menangkap keduanya, dengan nama error ditulis di dalam kurung:

```python
try:
    jumlah = int(data["jumlah"])
except (ValueError, TypeError):
    print("angka tidak sah")
```

Angka yang berhasil diubah masih perlu diperiksa dengan `if`. Jumlah `0` adalah angka yang sah, tetapi bukan pesanan yang masuk akal.

## Urutan pemeriksaan

Periksa dari yang paling luar: teksnya JSON atau bukan, lalu bentuknya, lalu kuncinya, baru nilainya. Di dalam fungsi, setiap pemeriksaan yang gagal langsung `return`, sehingga langkah berikutnya hanya berjalan untuk data yang sudah lolos.
