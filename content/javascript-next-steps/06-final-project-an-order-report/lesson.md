---
title: "Proyek akhir: laporan pesanan"
---
Setiap malam Mbak Laras ingin satu laporan singkat: berapa pesanan yang selesai, berapa yang batal, berapa omzetnya, dan pesanan mana yang paling besar. Semua alatnya sudah kamu punya. Sekarang tinggal merangkainya.

## Bentuk datanya

Setiap pesanan adalah objek yang berisi array barang:

```javascript
const daftar = [
  { id: "L-101", pembeli: "Dimas", status: "selesai",
    barang: [{ nama: "Lampu Meja", harga: 85000, jumlah: 1 }] },
  { id: "L-102", pembeli: "Sari", status: "batal",
    barang: [{ nama: "Lilin Aroma", harga: 30000, jumlah: 2 }] },
];
```

## Langkah 1: fungsi kecil untuk satu pesanan

Mulailah dari pertanyaan terkecil, misalnya berapa banyak barang dalam **satu** pesanan:

```javascript
const jumlahBarang = (pesanan) =>
  pesanan.barang.reduce((t, b) => t + b.jumlah, 0);
```

## Langkah 2: pilih, lalu ringkas

Pesanan yang batal tidak ikut dihitung. Pilih dulu dengan `filter`, lalu ringkas dengan `reduce` sambil memanggil fungsi kecil tadi:

```javascript
const selesai = daftar.filter((p) => p.status === "selesai");
const terkirim = selesai.reduce((t, p) => t + jumlahBarang(p), 0);
console.log(selesai.length, terkirim);   // 1 1
```

## Langkah 3: yang terbesar

Urutkan salinannya dari besar ke kecil, lalu ambil isi pertama. Pada array kosong hasilnya `undefined`, jadi periksa sebelum dipakai:

```javascript
const terbanyak = [...selesai].sort(
  (a, b) => jumlahBarang(b) - jumlahBarang(a)
)[0];
const teks = terbanyak === undefined ? "-" : terbanyak.id;
```

Bentuk `syarat ? nilaiJikaBenar : nilaiJikaSalah` adalah `if...else` singkat yang menghasilkan sebuah nilai.

## Langkah 4: susun laporannya

Kumpulkan setiap baris dalam array, lalu gabungkan dengan `join("\n")`:

```javascript
const baris = [
  `Pesanan selesai: ${selesai.length}`,
  `Barang terkirim: ${terkirim}`,
  `Pesanan terbanyak: ${teks}`,
];
console.log(baris.join("\n"));
```

Pola ini berlaku untuk hampir semua laporan: fungsi kecil, pilih, ringkas, lalu susun.
