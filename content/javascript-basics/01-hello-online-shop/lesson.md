---
title: Halo, Toko Online!
---
Mbak Sekar menjual tas, topi, dan syal rajutan buatan tangan lewat toko online kecil bernama **Rajut Sekar**. Selama ini semua hitungan ia kerjakan di buku tulis. Kamu diminta membantu dengan JavaScript, bahasa yang dipakai hampir semua situs web.

## Menampilkan teks dengan `console.log`

```javascript
console.log("Pesanan baru masuk!");
```

Hasilnya:

```
Pesanan baru masuk!
```

Teks diapit tanda kutip, boleh `"..."` atau `'...'`. Angka ditulis tanpa kutip. Setiap `console.log` menulis satu baris. Baris yang diawali `//` adalah komentar dan diabaikan.

## Menyimpan nilai: `const` dan `let`

Nilai bisa diberi nama supaya bisa dipakai lagi:

```javascript
const namaProduk = "Topi rajut"; // tidak akan berubah
let stok = 8;                    // boleh berubah

stok = stok - 1;
console.log(stok); // 7
```

Pakai `const` untuk nilai yang tetap, dan `let` untuk nilai yang nanti diganti. Mengganti isi `const` membuat program berhenti dengan error. Biasakan mulai dengan `const`, lalu ubah menjadi `let` hanya kalau memang perlu.

## Menyisipkan nilai ke dalam teks

Teks yang diapit **backtick** (tanda `` ` ``, di kiri angka 1 pada keyboard) boleh disisipi nilai dengan `${...}`:

```javascript
const harga = 45000;
console.log(`${namaProduk}: Rp${harga}`);
```

Hasilnya:

```
Topi rajut: Rp45000
```

Teks seperti ini disebut *template literal*. Dengan kutip biasa, `${harga}` akan tampil apa adanya, jadi pastikan kamu memakai backtick.

Tulis kodemu di editor sebelah lalu tekan **Periksa jawaban**. Kalau semua tes hijau, latihan itu selesai.
