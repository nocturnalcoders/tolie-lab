---
title: "Proyek Akhir: Total Keranjang"
---
Saatnya menggabungkan semuanya. Mbak Sekar ingin halaman keranjang menghitung sendiri jumlah yang harus dibayar pembeli.

## Keranjang adalah array berisi objek

```javascript
const keranjang = [
  { nama: "Tas rajut", harga: 85000, jumlah: 2 },
  { nama: "Topi rajut", harga: 45000, jumlah: 1 },
];
```

Dengan `for...of`, setiap putaran memberi satu objek, dan propertinya dibaca dengan titik:

```javascript
for (const item of keranjang) {
  console.log(`${item.nama}: ${item.jumlah} buah`);
}
```

## Aturan toko

1. **Subtotal** adalah jumlah dari harga dikali jumlah untuk setiap isi keranjang.
2. **Diskon 10%** dari subtotal jika subtotal Rp300.000 atau lebih. Di bawah itu diskonnya 0.
3. **Ongkos kirim** Rp15.000, dan gratis jika subtotal Rp200.000 atau lebih.
4. **Total bayar** adalah subtotal dikurangi diskon, ditambah ongkos kirim.

Sepuluh persen dari sebuah angka dihitung dengan `angka * 10 / 100`.

## Pecah menjadi fungsi kecil

Jangan menulis satu fungsi raksasa. Buat satu fungsi untuk setiap aturan, lalu gabungkan. Fungsi boleh memanggil fungsi lain:

```javascript
function hargaSatuan(item) {
  return item.harga;
}

function labelItem(item) {
  return `${item.nama} @ Rp${hargaSatuan(item)}`;
}
```

Fungsi kecil mudah diperiksa satu per satu. Kalau total akhirnya salah, kamu tinggal mencari potongan mana yang hasilnya keliru. Dan kalau suatu hari aturan diskon berubah, hanya satu fungsi yang perlu disentuh.

Selesaikan dua latihan terakhir ini, dan keranjang Rajut Sekar siap dipakai. Selamat, kamu sudah menulis program JavaScript yang benar-benar berguna!
