---
title: Membuat tabel dengan CREATE TABLE
---
Sampai sekarang kamu membaca tabel yang sudah jadi dengan `SELECT`. Kali ini Bu Rina ingin mencatat hal baru di **Warung Kopi Senja**, dan belum ada tabelnya. Kamu yang akan membuatnya.

## CREATE TABLE

Membuat tabel berarti menentukan **nama tabel** dan **daftar kolomnya**. Tiap kolom punya nama dan **tipe data**:

```sql
CREATE TABLE menu (
  id INTEGER,
  nama TEXT,
  harga INTEGER
);
```

Kolom ditulis di dalam kurung, dipisah koma, dan tidak ada koma setelah kolom terakhir. Tabel yang baru dibuat masih kosong: kolomnya ada, barisnya belum.

## Tiga tipe data

| Tipe | Isinya | Contoh |
|---|---|---|
| `INTEGER` | bilangan bulat | `7`, `15000` |
| `TEXT` | tulisan | `'Kopi Susu'`, `'2024-03-04'` |
| `REAL` | bilangan berkoma | `2.5`, `0.25` |

Cara memilihnya: tanyakan apa yang akan disimpan. Harga dalam rupiah dan jumlah porsi selalu bulat, jadi `INTEGER`. Nama, kategori, dan tanggal adalah tulisan, jadi `TEXT`. Berat biji kopi bisa 2.5 kg, jadi `REAL`. Di SQL, pemisah desimal adalah titik, bukan koma.

## Memberi nama

Pakai huruf kecil dan garis bawah, tanpa spasi: `nama`, `tanggal_beli`. Pilih nama yang menjelaskan isinya, karena nama itulah yang nanti ditulis di setiap `SELECT`.

## Mencoba tabel baru

Tabel baru bisa langsung diisi dan dibaca. Pengisian dibahas lengkap di pelajaran berikutnya, tetapi beginilah bentuknya:

```sql
INSERT INTO menu VALUES (1, 'Kopi Hitam', 10000);
SELECT * FROM menu;
```

Dua tabel tidak boleh bernama sama. Kalau `CREATE TABLE menu` dijalankan saat tabel `menu` sudah ada, database menolak dengan pesan `table menu already exists`.

Di latihan kursus ini, jawabanmu diperiksa dengan cara melihat **keadaan tabel sesudah perintahmu dijalankan**. Karena itu nama tabel dan nama kolom harus persis seperti yang diminta.
