---
title: Daftar Produk dengan Array dan Perulangan
---
Satu pesanan jarang berisi satu barang saja. Untuk menyimpan banyak nilai sekaligus, JavaScript punya **array**: daftar nilai yang berurutan.

## Membuat dan membaca array

```javascript
const produk = ["Tas rajut", "Topi rajut", "Syal"];

console.log(produk[0]);     // Tas rajut
console.log(produk.length); // 3
```

Posisi dihitung **mulai dari 0**, jadi isi pertama ada di `produk[0]` dan isi terakhir di `produk[produk.length - 1]`.

## Menambah isi

```javascript
produk.push("Gantungan kunci");
console.log(produk.length); // 4
```

`push` menambah isi di ujung array. Ini boleh walaupun `produk` dibuat dengan `const`: yang tidak boleh adalah mengganti `produk` dengan array lain.

## Mengunjungi setiap isi dengan `for...of`

```javascript
const hargaPesanan = [85000, 45000, 60000];

for (const harga of hargaPesanan) {
  console.log(`Rp${harga}`);
}
```

Baris di dalam `{ }` dijalankan sekali untuk setiap isi array, dan `harga` berganti nilai di setiap putaran.

## Pola: menjumlahkan

Siapkan penampung di luar perulangan, lalu tambahkan sedikit demi sedikit:

```javascript
let jumlahBarang = 0;
for (const banyak of [2, 1, 3]) {
  jumlahBarang = jumlahBarang + banyak;
}
console.log(jumlahBarang); // 6
```

Penampungnya memakai `let` karena nilainya terus berubah. Pola yang sama dipakai untuk mengumpulkan isi ke array baru: mulai dari `[]`, lalu `push` isi yang lolos pemeriksaan `if`.

Saat array ditampilkan dengan `console.log`, hasilnya di sini ditulis rapat seperti `[85000,45000]`.
