---
title: "Method: Parameter, Tipe Balik, dan static"
---
Menghitung total dan mencetak struk dilakukan berkali-kali di kasir. Di Java, potongan kode yang diberi nama dan bisa dipanggil ulang disebut **method** (di Python: fungsi).

```java
public class Kasir {
    static int hitungTotal(int harga, int jumlah) {
        return harga * jumlah;
    }

    static boolean perluPesan(int stok) {
        return stok < 5;
    }

    static void cetakStruk(String judul, int total) {
        System.out.println(judul + ": Rp" + total);
    }

    public static void main(String[] args) {
        int total = hitungTotal(48000, 3);
        cetakStruk("Kamus Saku", total);
        System.out.println(perluPesan(3));
    }
}
```

```
Kamus Saku: Rp144000
true
```

## Membaca kepala method

Ambil `static int hitungTotal(int harga, int jumlah)`:

- `int` sebelum nama adalah **tipe balik**: jenis nilai yang dikembalikan `return`.
- `hitungTotal` adalah namanya.
- `(int harga, int jumlah)` adalah **parameter**, masing-masing ditulis bersama tipenya.

Nilai yang di-`return` harus cocok dengan tipe balik. Compiler memeriksanya.

`void` berarti method itu **tidak mengembalikan apa-apa**. `cetakStruk` hanya mencetak, jadi tidak ada `return total;` di dalamnya, dan hasilnya tidak bisa disimpan ke variabel.

## Parameter adalah salinan

Saat `hitungTotal(48000, 3)` dipanggil, `harga` berisi salinan `48000`. Mengubah parameter bertipe `int`, `double`, atau `boolean` di dalam method **tidak** mengubah variabel milik pemanggil.

## Arti static

`static` berarti method itu milik **class**, bukan milik sebuah objek, sehingga bisa dipanggil langsung tanpa membuat objek. `main` sendiri `static`, karena itu ia bisa memanggil `hitungTotal(...)` begitu saja. Urutan penulisan method di dalam class bebas: `main` boleh ditulis paling atas.

Sekarang baris `public static void main(String[] args)` bisa dibaca utuh: terbuka untuk dipanggil dari luar, milik class, tidak mengembalikan nilai, bernama `main`, dan menerima array teks.

## Dibandingkan dengan Python

- `def hitung_total(harga, jumlah):` tidak menyebut tipe. Java menuliskan tipe tiap parameter dan tipe baliknya.
- Fungsi Python tanpa `return` diam-diam mengembalikan `None`. Di Java kamu menulis `void`, dan memakai hasilnya ditolak compiler.
