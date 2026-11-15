---
title: "Keputusan: if, else, dan equals"
---
Toko Buku Lentera memberi diskon untuk belanja besar, dan lebih mudah lagi bagi anggota. Program kasir harus mengambil keputusan.

```java
public class Diskon {
    public static void main(String[] args) {
        int total = 180000;
        boolean anggota = true;

        if (total >= 200000) {
            System.out.println("Diskon 15%");
        } else if (total >= 100000 && anggota) {
            System.out.println("Diskon 10%");
        } else {
            System.out.println("Tanpa diskon");
        }
    }
}
```

```
Diskon 10%
```

Cara membacanya:

- Kondisi selalu di dalam **kurung** `( )`, dan bloknya di dalam `{ }`. Tidak ada titik dua.
- Java memeriksa dari atas dan berhenti di cabang **pertama** yang benar. Cabang sesudahnya dilewati, walaupun kondisinya juga benar.
- Pilihan berikutnya ditulis `else if`, dua kata.

| Tulisan | Artinya |
| --- | --- |
| `==`, `!=` | sama dengan, tidak sama dengan |
| `>`, `>=`, `<`, `<=` | perbandingan angka |
| `&&` | dan: kedua sisi harus benar |
| <code>&#124;&#124;</code> | atau: cukup salah satu benar |
| `!` | bukan: membalik `true` dan `false` |

`=` menyimpan nilai, `==` membandingkan. Kondisi harus bertipe `boolean`, sehingga `if (stok = 0)` ditolak compiler.

## Membandingkan String: equals, bukan ==

```java
String kode = "BK";
String ketikan = new String("BK");

System.out.println(kode == ketikan);                // false
System.out.println(kode.equals(ketikan));           // true
System.out.println(kode.equals("bk"));              // false
System.out.println(kode.equalsIgnoreCase("bk"));    // true
```

Untuk `String`, `==` bertanya "apakah ini **objek yang sama**?", sedangkan `equals` bertanya "apakah **isinya** sama?". Teks yang datang dari keyboard atau berkas selalu objek baru, jadi `==` bisa bernilai `false` padahal tulisannya persis sama. Kesalahan ini lolos kompilasi dan tidak memunculkan pesan apa pun; programnya saja yang diam-diam salah.

Untuk `int`, `double`, dan `boolean`, `==` memang cara yang benar.

## Dibandingkan dengan Python

- `elif` menjadi `else if`; `and`, `or`, `not` menjadi `&&`, `||`, `!`.
- `==` pada teks di Python membandingkan isi. Padanannya di Java adalah `.equals(...)`. `==` pada objek di Java lebih mirip `is` di Python.
