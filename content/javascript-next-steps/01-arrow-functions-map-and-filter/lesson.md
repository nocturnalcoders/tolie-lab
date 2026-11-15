---
title: Fungsi panah, map, dan filter
---
Toko Lentera, toko online kecil milik Mbak Laras, menjual lampu dan lilin hias. Datanya makin banyak: daftar produk, stok, pesanan. Di kursus dasar kamu mengolah array dengan `for...of`. Sekarang kita pakai **metode array**, cara yang lebih ringkas untuk pekerjaan yang sama.

## Fungsi panah

Fungsi panah adalah cara singkat menulis fungsi:

```javascript
const denganOngkir = (harga) => harga + 10000;
console.log(denganOngkir(50000));   // 60000
```

Kalau isinya hanya satu ekspresi, tidak perlu `{}` maupun `return`: hasil ekspresi itu langsung dikembalikan. Kalau isinya beberapa baris, pakai `{}` dan tulis `return` seperti biasa.

## map: mengubah setiap isi

`map` menjalankan sebuah fungsi pada setiap isi array dan mengumpulkan hasilnya di array **baru**. Array aslinya tidak berubah:

```javascript
const harga = [85000, 30000, 45000];
const hargaBaru = harga.map((h) => h + 5000);
console.log(hargaBaru);   // [90000,35000,50000]
console.log(harga);       // [85000,30000,45000]
```

## filter: memilih sebagian

`filter` hanya menyimpan isi yang membuat fungsinya bernilai `true`:

```javascript
const produk = [
  { nama: "Lampu Meja", harga: 85000, stok: 4 },
  { nama: "Lilin Aroma", harga: 30000, stok: 0 },
  { nama: "Lampion Kertas", harga: 45000, stok: 7 },
];
const murah = produk.filter((p) => p.harga < 50000);
console.log(murah.length);   // 2
```

Kalau tidak ada yang cocok, hasilnya array kosong `[]`, bukan error.

## Merangkai keduanya

Karena `filter` mengembalikan array, hasilnya bisa langsung disambung dengan `map`:

```javascript
const namaMurah = produk
  .filter((p) => p.harga < 50000)
  .map((p) => p.nama);
console.log(namaMurah);   // ["Lilin Aroma","Lampion Kertas"]
```

Bacanya dari atas ke bawah: pilih dulu yang murah, lalu ambil namanya saja.
