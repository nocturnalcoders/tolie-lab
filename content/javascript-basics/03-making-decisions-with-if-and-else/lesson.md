---
title: Mengambil Keputusan dengan if dan else
---
Rajut Sekar punya aturan baru: **belanja Rp200.000 atau lebih gratis ongkos kirim**. Program sekarang harus bisa memilih.

## Perbandingan

Perbandingan menghasilkan `true` atau `false`:

| Tulisan | Artinya |
| --- | --- |
| `a === b` | sama dengan |
| `a !== b` | tidak sama dengan |
| `a > b` | lebih besar |
| `a >= b` | lebih besar atau sama |
| `a < b` | lebih kecil |
| `a <= b` | lebih kecil atau sama |

Satu tanda `=` menyimpan nilai, sedangkan `===` membandingkan.

## `===`, bukan `==`

JavaScript juga punya `==`, tetapi `==` diam-diam mengubah jenis nilai sebelum membandingkan:

```javascript
console.log("5" == 5);  // true, teks "5" dianggap angka
console.log("5" === 5); // false, teks bukan angka
```

Kejutan seperti ini sering menjadi sumber bug. Biasakan selalu memakai `===` dan `!==`.

## if, else if, else

```javascript
function pesanOngkir(total) {
  if (total >= 200000) {
    return "Gratis ongkir";
  } else {
    return "Ongkir Rp15000";
  }
}
```

Kondisi ditulis di dalam tanda kurung, dan baris yang ikut diapit `{ }`. Untuk lebih dari dua pilihan, pakai `else if`:

```javascript
function ukuranPesanan(jumlah) {
  if (jumlah >= 10) {
    return "Besar";
  } else if (jumlah >= 3) {
    return "Sedang";
  } else {
    return "Kecil";
  }
}
```

JavaScript memeriksa dari atas dan berhenti di kondisi pertama yang benar, jadi urutan kondisi itu penting. Begitu `return` dijalankan, fungsi langsung selesai.
