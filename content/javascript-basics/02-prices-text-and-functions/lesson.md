---
title: Harga, Teks, dan Fungsi
---
Pesanan mulai ramai, dan Mbak Sekar terus mengulang hitungan yang sama: harga dikali jumlah. Hitungan yang berulang sebaiknya dibungkus menjadi **fungsi**.

## Angka

```javascript
console.log(85000 + 45000); // 130000
console.log(60000 * 2);     // 120000
console.log(100000 / 4);    // 25000
console.log(17 % 5);        // 2, sisa pembagian
```

## Teks

Teks disebut *string*. String punya beberapa alat bawaan:

```javascript
const nama = "syal";
console.log(nama.length);        // 4, jumlah karakter
console.log(nama.toUpperCase()); // SYAL
console.log("Rp" + 60000);       // Rp60000
```

Tanda `+` menjumlahkan angka, tetapi **menyambung** kalau salah satunya string. Supaya tidak bingung, pakai template literal untuk menyusun teks.

## Fungsi

Fungsi adalah resep yang diberi nama. Bahan yang masuk disebut **parameter**, dan hasilnya dikirim keluar dengan `return`:

```javascript
function hargaSetelahPotongan(harga, potongan) {
  return harga - potongan;
}

console.log(hargaSetelahPotongan(85000, 5000)); // 80000
console.log(hargaSetelahPotongan(45000, 0));    // 45000
```

Fungsi baru bekerja saat **dipanggil** dengan namanya dan tanda kurung. Satu fungsi bisa dipanggil berkali-kali dengan nilai berbeda.

## `return` bukan `console.log`

`return` menyerahkan hasil kepada pemanggil, sedangkan `console.log` hanya menampilkannya. Fungsi tanpa `return` menghasilkan `undefined`.

Mulai pelajaran ini, kamu cukup menulis fungsinya. Tes yang akan memanggil fungsimu dengan beberapa nilai berbeda lalu menampilkan hasilnya, jadi nama fungsi harus sama persis dengan yang diminta.
