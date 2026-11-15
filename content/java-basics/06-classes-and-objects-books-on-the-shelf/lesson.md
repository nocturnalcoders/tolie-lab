---
title: "Class dan Objek: Buku di Rak"
---
Sejauh ini judul, harga, dan stok sebuah buku tersimpan di variabel yang terpisah-pisah. Class memungkinkan Pak Bayu menyatukannya menjadi satu jenis data baru: `Buku`.

```java
public class Buku {
    String judul;
    int harga;
    int stok;

    Buku(String judul, int harga, int stok) {
        this.judul = judul;
        this.harga = harga;
        this.stok = stok;
    }

    void jual(int jumlah) {
        stok -= jumlah;
    }

    int nilaiStok() {
        return harga * stok;
    }
}
```

```java
public class TokoBuku {
    public static void main(String[] args) {
        Buku kamus = new Buku("Kamus Saku", 50000, 10);
        Buku atlas = new Buku("Atlas Dunia", 120000, 4);

        kamus.jual(2);
        System.out.println(kamus.judul + ": " + kamus.stok);
        System.out.println(atlas.judul + ": " + atlas.stok);
        System.out.println(kamus.nilaiStok());
    }
}
```

```
Kamus Saku: 8
Atlas Dunia: 4
400000
```

## Bagian-bagian class

- **Field** (`judul`, `harga`, `stok`): data yang dimiliki setiap buku.
- **Constructor** `Buku(...)`: namanya sama dengan nama class dan **tidak punya tipe balik**, `void` pun tidak. Ia dijalankan saat objek dibuat, untuk mengisi field.
- `this.harga = harga;`: `this.harga` adalah field milik objek ini, sedangkan `harga` di kanan adalah parameter. Tanpa `this`, `harga = harga;` hanya mengisi parameter dengan dirinya sendiri, dan field tetap `0`.
- **Method** `jual` dan `nilaiStok` tidak `static`: keduanya bekerja pada data satu objek tertentu.

## Class adalah cetakan, objek adalah bendanya

`new Buku("Kamus Saku", 50000, 10)` membuat satu **objek** dari cetakan `Buku`. `kamus` dan `atlas` adalah dua objek dengan field masing-masing: menjual kamus tidak mengubah stok atlas. Field dan method diakses dengan titik: `kamus.stok`, `kamus.jual(2)`.

Variabel bertipe class menyimpan **rujukan** ke objek. `Buku pilihan = kamus;` tidak menyalin buku; `pilihan` dan `kamus` menunjuk objek yang sama.

## Dibandingkan dengan Python

- `def __init__(self, judul, harga, stok):` menjadi constructor `Buku(String judul, int harga, int stok)`.
- `self.stok` menjadi `this.stok`, dan `this` tidak ditulis di daftar parameter.
- `Buku("Kamus Saku", 50000, 10)` menjadi `new Buku("Kamus Saku", 50000, 10)`.
