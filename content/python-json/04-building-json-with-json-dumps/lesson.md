---
title: Menyusun JSON dengan json.dumps
---
Sejauh ini Dapur Bu Sari hanya menerima JSON. Sekarang aplikasi pembukuan Bu Sari meminta data dikirim balik, juga dalam bentuk JSON. Arah sebaliknya dari `json.loads` adalah `json.dumps`: data Python menjadi teks JSON.

## print biasa bukan JSON

```python
import json

pesanan = {"pelanggan": "Dewi", "lunas": True, "catatan": None}
print(pesanan)
print(json.dumps(pesanan))
```

Hasilnya:

```
{'pelanggan': 'Dewi', 'lunas': True, 'catatan': None}
{"pelanggan": "Dewi", "lunas": true, "catatan": null}
```

Baris pertama adalah tulisan Python: kutip tunggal, `True`, `None`. Aplikasi lain tidak bisa membacanya. Baris kedua JSON yang sah.

## Urutan kunci yang pasti

Dua program bisa menyusun dictionary yang sama dengan urutan kunci berbeda. `sort_keys=True` mengurutkan kunci menurut abjad, sehingga hasilnya selalu sama:

```python
print(json.dumps({"total": 56000, "id": "AM-1021"}, sort_keys=True))
```

```json
{"id": "AM-1021", "total": 56000}
```

## Huruf beraksen

Secara bawaan, huruf di luar ASCII ditulis sebagai kode: `André` menjadi `"André"`. Tambahkan `ensure_ascii=False` supaya nama tampil apa adanya.

## Rapi atau ringkas

`indent=2` menulis setiap kunci di barisnya sendiri, enak dibaca manusia:

```python
data = {"id": "AM-1021", "menu": ["nasi rendang", "es teh manis"]}
print(json.dumps(data, indent=2, sort_keys=True))
```

```json
{
  "id": "AM-1021",
  "menu": [
    "nasi rendang",
    "es teh manis"
  ]
}
```

Sebaliknya, `separators=(",", ":")` membuang semua spasi untuk menghemat ukuran: `{"id":"AM-1021","total":56000}`.

## Hanya jenis data dasar

`json.dumps` menerima dictionary, list, teks, angka, `True`, `False`, dan `None`. Angka yang dibaca dengan `input()` masih berupa teks, jadi ubah dulu dengan `int()`. Kalau tidak, hasilnya `"2"`, bukan `2`.
