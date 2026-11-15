---
title: Mencari dan memeriksa data
---
Pembeli sering bertanya lewat chat: "Lilin Aroma masih ada?" atau "Kirim ke Cimahi gratis ongkir?" Untuk menjawabnya Mbak Laras tidak butuh seluruh daftar, cukup **satu** produk atau jawaban ya/tidak.

## find: mengambil satu isi

`find` mengembalikan isi **pertama** yang cocok, bukan array:

```javascript
const produk = [
  { nama: "Lampu Meja", harga: 85000, stok: 4 },
  { nama: "Lilin Aroma", harga: 30000, stok: 0 },
  { nama: "Lampion Kertas", harga: 45000, stok: 7 },
];
const lilin = produk.find((p) => p.nama === "Lilin Aroma");
console.log(lilin.harga);   // 30000
```

Kalau tidak ada yang cocok, hasilnya `undefined`. Membaca `.harga` dari `undefined` membuat program berhenti dengan error, jadi periksa dulu:

```javascript
const kipas = produk.find((p) => p.nama === "Kipas Angin");
if (kipas === undefined) {
  console.log("Produk tidak ditemukan");
}
```

## some dan every: jawaban ya atau tidak

`some` bernilai `true` kalau **minimal satu** isi cocok. `every` bernilai `true` kalau **semua** isi cocok:

```javascript
console.log(produk.some((p) => p.stok === 0));   // true
console.log(produk.every((p) => p.stok > 0));    // false
```

Hati-hati dengan array kosong: `some` menghasilkan `false` (tidak ada yang cocok), sedangkan `every` menghasilkan `true` (tidak ada yang melanggar). Kalau array kosong perlu jawaban khusus, periksa `produk.length === 0` lebih dulu.

## includes: apakah nilainya ada

Untuk array berisi teks atau angka, `includes` memeriksa apakah sebuah nilai ada di dalamnya:

```javascript
const gratisOngkir = ["Bandung", "Cimahi"];
console.log(gratisOngkir.includes("Cimahi"));   // true
console.log(gratisOngkir.includes("cimahi"));   // false
```

Perbandingannya harus persis sama, termasuk huruf besar dan kecil. Untuk array berisi objek, pakai `some` atau `find` dengan syarat yang kamu tulis sendiri.
