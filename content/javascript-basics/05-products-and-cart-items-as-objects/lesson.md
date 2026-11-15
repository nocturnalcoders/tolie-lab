---
title: Produk dan Isi Keranjang sebagai Objek
---
Sebuah produk punya nama, harga, dan stok. Menyimpannya di tiga variabel terpisah cepat berantakan. **Objek** mengikat data yang saling berkaitan menjadi satu.

## Membuat objek

```javascript
const produk = {
  nama: "Tas rajut",
  harga: 85000,
  stok: 12,
};
```

Objek ditulis di dalam `{ }` dan berisi pasangan **nama properti: nilai**, dipisahkan koma.

## Membaca dan mengubah properti

Pakai tanda titik:

```javascript
console.log(produk.nama);  // Tas rajut
console.log(produk.harga); // 85000

produk.stok = produk.stok - 1;
console.log(produk.stok);  // 11
```

Sama seperti array, isi objek boleh diubah walaupun objeknya dibuat dengan `const`. Membaca properti yang tidak ada menghasilkan `undefined`, dan itu biasanya tanda salah ketik.

## Objek dan fungsi

Fungsi bisa menerima objek sebagai parameter:

```javascript
function labelProduk(p) {
  return `${p.nama} (Rp${p.harga})`;
}

console.log(labelProduk(produk)); // Tas rajut (Rp85000)
```

Fungsi juga bisa membuat objek baru lalu mengembalikannya:

```javascript
function buatProduk(nama, harga) {
  return { nama: nama, harga: harga, stok: 0 };
}
```

## Isi keranjang

Satu baris di keranjang belanja Rajut Sekar adalah objek dengan tiga properti:

```javascript
const item = { nama: "Syal", harga: 60000, jumlah: 2 };
```

Saat objek ditampilkan dengan `console.log`, hasilnya di sini ditulis rapat, dengan properti sesuai urutan penulisannya:

```
{"nama":"Syal","harga":60000,"jumlah":2}
```
