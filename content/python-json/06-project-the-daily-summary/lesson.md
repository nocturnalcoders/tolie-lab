---
title: "Proyek: ringkasan harian"
---
Saatnya menggabungkan semuanya. Setiap malam AntarMakan mengirim satu baris JSON berisi semua pesanan hari itu. Bu Sari ingin dua hal: ringkasan singkat yang bisa ia baca di ponsel, dan ringkasan yang sama dalam bentuk JSON untuk aplikasi pembukuannya.

```json
[
  {"id": "AM-1021", "pelanggan": "Dewi", "status": "selesai",
   "item": [{"menu": "nasi rendang", "jumlah": 2, "harga": 28000}]},
  {"id": "AM-1022", "pelanggan": "Budi", "status": "batal",
   "item": [{"menu": "ayam geprek", "jumlah": 3, "harga": 22000}]}
]
```

## Rencana

1. **Baca** baris masukan dengan `json.loads`.
2. **Kumpulkan** angka dari pesanan yang selesai: banyaknya pesanan, omzet, porsi terjual per menu, dan nama pelanggan.
3. **Cetak** hasilnya, sebagai teks atau dengan `json.dumps`.

## Fungsi kecil untuk satu pesanan

Total satu pesanan dihitung di banyak tempat, jadi jadikan fungsi. Sebagian pesanan datang tanpa kunci `item`, maka pakai `.get` dengan cadangan list kosong:

```python
def total_pesanan(pesanan):
    total = 0
    for item in pesanan.get("item", []):
        total += item["jumlah"] * item["harga"]
    return total
```

Pesanan tanpa item bernilai `0` dan tidak menimbulkan error.

## Pelanggan unik

Set menyimpan setiap nama satu kali saja. Namun `json.dumps` tidak mengenal set, dan urutan isinya tidak pasti. `sorted` menyelesaikan keduanya, karena hasilnya list yang terurut:

```python
pelanggan = set()
pelanggan.add("Dewi")
pelanggan.add("André")
pelanggan.add("Dewi")
print(sorted(pelanggan))   # ['André', 'Dewi']
```

## Menyusun ringkasan

Kumpulkan semua hasil dalam satu dictionary, lalu cetak dengan pengaturan dari pelajaran 4:

```python
ringkasan = {"omzet": omzet, "pelanggan": sorted(pelanggan), "terjual": terjual}
print(json.dumps(ringkasan, indent=2, sort_keys=True, ensure_ascii=False))
```

`sort_keys=True` juga mengurutkan kunci di dalam `terjual`, jadi nama menu ikut tampil menurut abjad.

Kini kamu bisa menerima data dari sebuah aplikasi, meringkasnya, dan mengirimkannya lagi, seperti program yang saling bertukar data setiap hari.
