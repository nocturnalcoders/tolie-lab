---
title: "Rekursi: kardus di dalam kardus"
---
Sebagian masalah berisi **versi kecil dari dirinya sendiri**. Untuk masalah seperti itu, sebuah fungsi boleh memanggil dirinya sendiri. Itulah **rekursi**.

## Berapa urutan antar?

Kurir membawa 3 paket. Ada berapa urutan untuk mengantarnya? Paket pertama bisa dipilih dengan 3 cara, dan setelah itu tersisa masalah yang sama untuk 2 paket. Jadi:

`urutan(3) = 3 × urutan(2)`, `urutan(2) = 2 × urutan(1)`, dan seterusnya.

```python
def urutan(n):
    if n <= 1:
        return 1
    return n * urutan(n - 1)

print(urutan(3))   # 6
```

Setiap fungsi rekursif punya dua bagian:

- **Kasus dasar**: masalah terkecil yang jawabannya langsung diketahui. Satu paket (atau tidak ada paket) hanya punya 1 urutan.
- **Langkah rekursif**: memanggil diri sendiri dengan masalah yang **lebih kecil**, di sini `n - 1`.

Tanpa kasus dasar, fungsi terus memanggil dirinya sampai Python menghentikannya dengan `RecursionError`.

## Kardus bersarang

Rekursi paling terasa gunanya saat datanya sendiri bersarang. Di gudang, sebuah kardus bisa berisi barang lepas dan juga **kardus lain**, yang mungkin berisi kardus lagi. Kita tidak tahu berapa dalam sarangnya, jadi perulangan biasa sulit dipakai.

```python
isi = {
    "A": ["3", "B"],
    "B": ["2", "C"],
    "C": ["1"],
}

def hitung(nama):
    total = 0
    for benda in isi[nama]:
        if benda.isdigit():
            total += int(benda)
        else:
            total += hitung(benda)
    return total

print(hitung("A"))   # 6
```

Angka berarti jumlah barang lepas, sedangkan teks lain adalah nama kardus di dalamnya. `.isdigit()` bernilai `True` jika sebuah teks hanya berisi angka.

Cara membacanya: "jumlah barang dalam sebuah kardus adalah barang lepasnya ditambah jumlah barang di setiap kardus di dalamnya." Kasus dasarnya tidak ditulis dengan `if` khusus: kardus yang tidak berisi kardus lain tidak memanggil `hitung` lagi, dan di situlah rekursinya berhenti.
