---
title: JSON dan data bersarang
---
Pesanan Toko Lentera tidak diketik langsung di dalam program. Datanya datang dari server atau file sebagai **teks** berformat JSON. Sebelum bisa diolah, teks itu harus diubah dulu menjadi objek.

## JSON.parse: dari teks menjadi objek

```javascript
const teks = '{"id":"L-101","pembeli":{"nama":"Dimas","kota":"Bandung"}}';
const pesanan = JSON.parse(teks);
console.log(pesanan.id);   // L-101
```

`teks` hanyalah deretan huruf, jadi `teks.id` hasilnya `undefined`. Setelah `JSON.parse`, barulah isinya bisa dibaca seperti objek biasa.

## Data bersarang

Objek boleh berisi objek atau array lain. Bacanya selangkah demi selangkah dengan titik dan kurung siku:

```javascript
const pesanan = {
  id: "L-101",
  pembeli: { nama: "Dimas", kota: "Bandung" },
  barang: [
    { nama: "Lampu Meja", jumlah: 1 },
    { nama: "Lilin Aroma", jumlah: 2 },
  ],
};
console.log(pesanan.pembeli.kota);     // Bandung
console.log(pesanan.barang[1].nama);   // Lilin Aroma
console.log(pesanan.barang.length);    // 2
```

Karena `pesanan.barang` adalah array, semua metode yang sudah kamu pelajari bisa dipakai: `map`, `filter`, `reduce`.

## Destructuring: mengambil beberapa isi sekaligus

Daripada menulis `pesanan.` berulang-ulang, ambil isinya ke dalam variabel dengan nama yang sama:

```javascript
const { id, pembeli } = pesanan;
const { nama, kota } = pembeli;
console.log(`${id}: ${nama} (${kota})`);   // L-101: Dimas (Bandung)
```

## JSON.stringify: dari objek menjadi teks

Untuk menyimpan atau mengirim data, ubah kembali menjadi teks:

```javascript
const produk = { nama: "Lilin Aroma", stok: 5 };
const hasil = JSON.stringify(produk);
console.log(hasil);          // {"nama":"Lilin Aroma","stok":5}
console.log(typeof hasil);   // string
```

`typeof` menyebutkan jenis sebuah nilai. Di sini `string`, artinya `hasil` sudah berupa teks, bukan objek lagi.
