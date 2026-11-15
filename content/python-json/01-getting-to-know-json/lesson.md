---
title: Mengenal JSON
---
Dapur Bu Sari di Bandung menjual nasi kotak lewat aplikasi pesan-antar AntarMakan. Setiap pesanan yang masuk dikirim aplikasi sebagai teks berformat **JSON**. Bu Sari ingin program kecil yang bisa membacanya, dan kamu yang diminta membuatnya.

## Bentuk JSON

```json
{"id": "AM-1021", "pelanggan": "Dewi", "menu": "nasi rendang", "jumlah": 2, "harga": 28000}
```

Mirip dictionary Python: pasangan kunci dan nilai di dalam kurung kurawal. Bedanya, JSON hanyalah **teks**. Kuncinya selalu diapit tanda kutip ganda, dan teks di dalamnya juga.

## Dari teks menjadi dictionary

Modul `json` sudah ada di dalam Python. `json.loads` mengubah teks JSON menjadi data Python:

```python
import json

teks = input()
pesanan = json.loads(teks)
print(pesanan["pelanggan"])
print(pesanan["jumlah"] * pesanan["harga"])
```

Untuk teks di atas, tampil `Dewi` lalu `56000`. Setelah `json.loads`, `pesanan` adalah dictionary biasa, jadi semua yang sudah kamu kuasai tetap berlaku. Urutan kunci di dalam teks tidak penting, karena nilainya diambil lewat nama kunci.

## Jenis nilai

Angka tanpa tanda kutip menjadi angka, jadi bisa langsung dihitung tanpa `int()`. Tiga nilai khusus berubah ejaannya:

| JSON | Python |
| --- | --- |
| `true` | `True` |
| `false` | `False` |
| `null` | `None` |

```python
pesanan = json.loads('{"lunas": true, "catatan": null}')
if pesanan["lunas"]:
    print("Sudah dibayar")
if pesanan["catatan"] is None:
    print("Tidak ada catatan")
```

`null` berarti "tidak ada isinya", dan diperiksa dengan `is None`.

Hati-hati dengan angka di dalam tanda kutip: `"2"` tetap teks, bukan angka.
