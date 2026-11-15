---
title: Aturan pada kolom
---
Sejauh ini tabel menerima apa saja: menu tanpa nama, harga minus, dua pelanggan dengan `id` yang sama. Bu Rina tidak mau data **Warung Kopi Senja** seperti ini:

| id | nama | kategori | harga |
|---|---|---|---|
| 1 | Kopi Hitam | minuman | 10000 |
| 1 | Kopi Susu | NULL | -15000 |
| 3 | NULL | makanan | 0 |

Aturan (*constraint*) ditulis setelah tipe kolom saat membuat tabel. Baris yang melanggar ditolak dengan pesan galat, dan tabel tidak berubah.

```sql
CREATE TABLE menu (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,
  kategori TEXT NOT NULL DEFAULT 'minuman',
  harga INTEGER NOT NULL CHECK (harga > 0)
);
```

## Lima aturan

| Aturan | Artinya |
|---|---|
| `PRIMARY KEY` | tanda pengenal baris: wajib berbeda di tiap baris |
| `NOT NULL` | kolom tidak boleh kosong |
| `UNIQUE` | tidak boleh ada dua baris dengan nilai yang sama |
| `DEFAULT nilai` | nilai yang dipakai kalau kolom tidak disebut saat `INSERT` |
| `CHECK (syarat)` | nilai harus memenuhi syarat di dalam kurung |

Satu kolom boleh punya beberapa aturan, dipisah spasi.

## PRIMARY KEY

Tiap tabel sebaiknya punya satu kolom pengenal, biasanya `id`. Dengan `INTEGER PRIMARY KEY`, nomornya diisi otomatis kalau kamu tidak menyebut `id` saat `INSERT`, seperti di pelajaran 2.

## DEFAULT dan CHECK

```sql
INSERT INTO menu (nama, harga) VALUES ('Teh Tarik', 12000);
```

`kategori` tidak disebut, jadi isinya `'minuman'`, bukan `NULL`. Syarat di dalam `CHECK` ditulis seperti syarat `WHERE`:

```sql
INSERT INTO menu (nama, harga) VALUES ('Roti Bakar', 0);
```

Perintah ini ditolak dengan `CHECK constraint failed`, karena 0 tidak lebih besar dari 0.

Aturan menjaga data di pintu masuk: salah ketik ketahuan saat itu juga, bukan sebulan kemudian ketika laporan terlihat aneh.

Di latihan, pemeriksa mencoba memasukkan beberapa baris ke tabelmu, termasuk baris yang melanggar aturan. Baris yang melanggar harus tertolak, sehingga hanya baris yang sah yang tersisa.
