---
title: Tipe Data dan Variabel
---
Di Python, Sari cukup menulis `stok = 12`. Di Java, setiap variabel harus menyebut **tipenya** saat dibuat, dan tipe itu tidak bisa berganti.

```java
public class DataBuku {
    public static void main(String[] args) {
        String judul = "Kamus Saku";
        int stok = 12;
        double harga = 48500.5;
        boolean tersedia = true;

        stok = stok - 2;
        System.out.println(judul + ", stok " + stok);
        System.out.println(harga);
        System.out.println(tersedia);
    }
}
```

```
Kamus Saku, stok 10
48500.5
true
```

| Tipe | Isinya | Contoh |
| --- | --- | --- |
| `int` | bilangan bulat | `12` |
| `double` | bilangan pecahan | `48500.5` |
| `boolean` | `true` atau `false` (huruf kecil) | `true` |
| `String` | teks (S besar) | `"Kamus Saku"` |

Tipe ditulis sekali saja. Setelah `int stok = 12;`, cukup tulis `stok = 10;`. Baris `stok = "banyak";` ditolak compiler karena `stok` hanya boleh berisi `int`.

Bilangan bulat boleh masuk ke `double` (`double harga = 85000;`), tetapi tidak sebaliknya: `int x = 2.5;` ditolak. Kalau memang mau, tulis `(int) 2.5`, dan pecahannya dibuang sehingga hasilnya `2`.

## Pembagian bilangan bulat

```java
System.out.println(17 / 5);            // 3
System.out.println(17 % 5);            // 2
System.out.println(17 / 5.0);          // 3.4
System.out.println((double) 17 / 5);   // 3.4
```

`int` dibagi `int` hasilnya `int`: pecahannya **dibuang**, bukan dibulatkan. `%` memberi sisa bagi. Begitu salah satu sisinya `double`, hasilnya `double`.

## Tanda + pada String

```java
int stok = 4;
System.out.println("Stok: " + stok + 1);     // Stok: 41
System.out.println("Stok: " + (stok + 1));   // Stok: 5
System.out.println(stok + 1 + " buku");      // 5 buku
```

`+` dikerjakan dari kiri ke kanan. Selama kedua sisinya angka, ia menjumlahkan. Begitu salah satu sisinya `String`, ia **menyambung** teks.

## Dibandingkan dengan Python

- `17 / 5` di Python menghasilkan `3.4`; di Java `3`, mirip `17 // 5`.
- `"Stok: " + 4` di Python error; di Java angkanya otomatis dijadikan teks.
- `True` dan `False` di Python, `true` dan `false` di Java.
