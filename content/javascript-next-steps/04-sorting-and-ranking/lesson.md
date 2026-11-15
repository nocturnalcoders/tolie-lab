---
title: Mengurutkan dan membuat peringkat
---
"Produk mana yang paling laku bulan ini?" Untuk menjawab Mbak Laras, datanya harus **diurutkan** dulu, lalu diambil beberapa yang teratas.

## sort dan fungsi pembanding

Tanpa bantuan, `sort` mengurutkan isinya sebagai **teks**, sehingga angka pun diurutkan seperti kata di kamus:

```javascript
console.log([10, 9, 100].sort());   // [10,100,9]
```

Karena itu beri `sort` sebuah **fungsi pembanding**. Fungsi ini menerima dua isi, `a` dan `b`. Kalau hasilnya negatif, `a` ditaruh lebih dulu. Kalau positif, `b` lebih dulu.

```javascript
const harga = [85000, 30000, 45000];
harga.sort((a, b) => a - b);
console.log(harga);   // [30000,45000,85000]
```

`a - b` mengurutkan dari kecil ke besar, `b - a` dari besar ke kecil.

## sort mengubah array aslinya

Berbeda dari `map` dan `filter`, `sort` mengubah array yang diurutkannya. Supaya data asli aman, salin dulu dengan `[...array]`:

```javascript
const produk = [
  { nama: "Lampu Meja", terjual: 10 },
  { nama: "Lampion Kertas", terjual: 12 },
  { nama: "Lilin Aroma", terjual: 7 },
];
const urut = [...produk].sort((a, b) => b.terjual - a.terjual);
console.log(urut[0].nama);     // Lampion Kertas
console.log(produk[0].nama);   // Lampu Meja
```

Kalau dua isi nilainya sama (hasil pembandingnya `0`), urutan aslinya dipertahankan.

## slice: mengambil yang teratas

`slice(0, 3)` mengembalikan array baru berisi paling banyak tiga isi pertama. Kalau isinya kurang dari tiga, semuanya diambil tanpa error:

```javascript
const duaTeratas = urut.slice(0, 2);
```

## Nomor peringkat

Fungsi di dalam `map` boleh menerima parameter kedua: **indeks** isi, mulai dari 0.

```javascript
const baris = urut.map((p, i) => `${i + 1}. ${p.nama}`);
console.log(baris.join("\n"));
```

`join("\n")` menggabungkan isi array menjadi satu teks, satu baris per isi:

```
1. Lampion Kertas
2. Lampu Meja
3. Lilin Aroma
```
