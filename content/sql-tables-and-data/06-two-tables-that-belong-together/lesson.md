---
title: Dua tabel yang berhubungan
---
Bu Rina ingin tahu **siapa** memesan apa di **Warung Kopi Senja**. Menulis nama pelanggan di setiap pesanan itu rawan: kalau Sari memesan sepuluh kali, satu salah ketik ("Sri") membuatnya terhitung sebagai orang lain.

Lebih baik pelanggan dicatat **sekali** di tabelnya sendiri, dan tiap pesanan cukup menyimpan `id` pelanggannya.

Tabel `pelanggan`:

| id | nama |
|---|---|
| 1 | Sari |
| 2 | Budi |

Tabel `pesanan`:

| id | pelanggan_id | menu | jumlah |
|---|---|---|---|
| 1 | 1 | Kopi Susu | 2 |
| 2 | 2 | Roti Bakar | 1 |
| 3 | 1 | Pisang Goreng | 1 |

Pesanan 1 dan 3 milik pelanggan 1, yaitu Sari.

## Foreign key

Kolom `pelanggan_id` disebut **foreign key**: isinya menunjuk ke `id` di tabel lain. Hubungan itu dinyatakan dengan `REFERENCES`:

```sql
CREATE TABLE pelanggan (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL
);

CREATE TABLE pesanan (
  id INTEGER PRIMARY KEY,
  pelanggan_id INTEGER REFERENCES pelanggan(id),
  menu TEXT,
  jumlah INTEGER
);
```

Tabel `pelanggan` dibuat lebih dulu, karena `pesanan` menunjuk kepadanya. Semua pesanan Sari bisa dicari dengan `WHERE` biasa:

```sql
SELECT menu, jumlah FROM pesanan WHERE pelanggan_id = 1;
```

## Urutan itu penting

Database menjaga supaya tidak ada pesanan yang menunjuk ke pelanggan yang tidak ada. Akibatnya ada dua urutan yang harus diingat:

- **Menambah**: pelanggan dulu, baru pesanannya.
- **Menghapus**: pesanannya dulu, baru pelanggannya.

Kalau urutannya terbalik, perintahnya ditolak dengan `FOREIGN KEY constraint failed`:

```sql
DELETE FROM pelanggan WHERE id = 1;  -- ditolak: Sari masih punya pesanan

DELETE FROM pesanan WHERE pelanggan_id = 1;
DELETE FROM pelanggan WHERE id = 1;  -- sekarang boleh
```

Satu catatan jujur: SQLite, database yang dipakai kursus ini, baru menjalankan penjagaan itu setelah dinyalakan dengan `PRAGMA foreign_keys = ON;`. Di latihan kedua, perintah itu sudah dijalankan untukmu.
