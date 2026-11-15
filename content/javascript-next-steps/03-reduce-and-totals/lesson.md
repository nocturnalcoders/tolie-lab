---
title: reduce dan menghitung total
---
`map` dan `filter` menghasilkan array. Tetapi pertanyaan Mbak Laras sering butuh **satu nilai** saja: berapa total belanja di keranjang ini? Berapa stok seluruh toko? Untuk meringkas array menjadi satu nilai, pakai `reduce`.

## Cara kerja reduce

`reduce` menerima dua hal: sebuah fungsi dan **nilai awal**. Fungsinya dipanggil untuk setiap isi, dengan dua parameter: hasil sejauh ini dan isi yang sedang dikunjungi. Apa pun yang dikembalikan menjadi hasil sejauh ini untuk isi berikutnya.

```javascript
const jumlah = [2, 1, 3];
const total = jumlah.reduce((sejauhIni, n) => sejauhIni + n, 0);
console.log(total);   // 6
```

Langkahnya: mulai dari `0`, lalu `0 + 2 = 2`, `2 + 1 = 3`, `3 + 3 = 6`.

Selalu tulis nilai awalnya. Dengan nilai awal `0`, array kosong menghasilkan `0`. Tanpa nilai awal, array kosong membuat program berhenti dengan error.

## Total dari array objek

Setiap barang di keranjang punya harga dan jumlah. Yang ditambahkan ke total adalah hasil kalinya:

```javascript
const keranjang = [
  { nama: "Lampu Meja", harga: 85000, jumlah: 1 },
  { nama: "Lilin Aroma", harga: 30000, jumlah: 2 },
];
const total = keranjang.reduce((t, b) => t + b.harga * b.jumlah, 0);
console.log(total);   // 145000
```

## Meringkas menjadi objek

Nilai awal tidak harus angka. Dengan nilai awal objek kosong `{}`, kita bisa menghitung berapa kali setiap kategori muncul:

```javascript
const kategori = ["lampu", "lilin", "lampu"];
const hitung = kategori.reduce((catatan, k) => {
  catatan[k] = (catatan[k] || 0) + 1;
  return catatan;
}, {});
console.log(hitung);   // {"lampu":2,"lilin":1}
```

`catatan[k]` membaca kunci yang namanya tersimpan di `k`. Saat sebuah kategori pertama kali muncul, nilainya masih `undefined`, sehingga `catatan[k] || 0` memberi `0`. Jangan lupa `return catatan`, karena itulah yang diteruskan ke isi berikutnya.
