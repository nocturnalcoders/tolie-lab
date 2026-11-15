---
title: "Perulangan: for, while, dan for-each"
---
Setiap sore Pak Bayu merekap penjualan empat hari terakhir. Data itu disimpan dalam **array**, dan perulangan yang mengolahnya.

```java
public class Rekap {
    public static void main(String[] args) {
        int[] terjual = {4, 7, 2, 5};

        int total = 0;
        for (int i = 0; i < terjual.length; i++) {
            total += terjual[i];
        }
        System.out.println("Total: " + total);

        for (int jumlah : terjual) {
            if (jumlah >= 5) {
                System.out.println("Hari ramai: " + jumlah);
            }
        }

        int stok = 20;
        int hari = 0;
        while (stok > 5) {
            stok -= 6;
            hari++;
        }
        System.out.println(hari + " hari, sisa " + stok);
    }
}
```

```
Total: 18
Hari ramai: 7
Hari ramai: 5
3 hari, sisa 2
```

## Array

`int[] terjual = {4, 7, 2, 5};` membuat array berisi empat `int`. Panjangnya tetap: `terjual.length` (tanpa kurung) bernilai `4`. Indeks mulai dari `0`, jadi elemen terakhir ada di `terjual[3]`. Mengakses `terjual[4]` lolos kompilasi, tetapi program berhenti dengan `ArrayIndexOutOfBoundsException` saat dijalankan.

## Tiga cara mengulang

- `for (int i = 0; i < terjual.length; i++)` punya tiga bagian: **awal**, **syarat lanjut**, dan **langkah**. `i++` berarti `i = i + 1`, dan `total += x` berarti `total = total + x`. Di sini `i` bernilai 0, 1, 2, 3.
- `for (int jumlah : terjual)` disebut for-each: "untuk setiap `jumlah` di dalam `terjual`". Kamu mendapat elemennya langsung, tanpa nomor indeks.
- `while (stok > 5)` mengulang selama syaratnya benar. Syarat diperiksa **sebelum** setiap putaran, jadi isinya bisa saja tidak pernah dijalankan.

Variabel yang dibuat di dalam loop, seperti `i` dan `jumlah`, hanya hidup di dalam loop itu. Di luar kurung kurawalnya, compiler tidak mengenalnya lagi.

## Dibandingkan dengan Python

| Python | Java |
| --- | --- |
| `for i in range(4):` | `for (int i = 0; i < 4; i++) {` |
| `for jumlah in terjual:` | `for (int jumlah : terjual) {` |
| `len(terjual)` | `terjual.length` |
| `[4, 7, 2, 5]` | `{4, 7, 2, 5}` |

Di Python variabel loop masih bisa dipakai setelah loop selesai. Di Java tidak.
