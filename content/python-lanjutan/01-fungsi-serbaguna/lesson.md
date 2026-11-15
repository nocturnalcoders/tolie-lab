---
title: Fungsi yang bisa dipakai ulang
---
Warung Kopi Senja makin ramai, dan program Bu Rina makin panjang. Rumus yang sama ditulis di banyak tempat, jadi kalau ada yang berubah harus diperbaiki satu per satu. Di kursus dasar kamu sudah berkenalan dengan **fungsi**. Sekarang kita pakai fungsi sebagai alat utama untuk merapikan kode.

## Beberapa parameter

Fungsi boleh menerima lebih dari satu parameter, dipisahkan koma:

```python
def subtotal(harga, jumlah):
    return harga * jumlah

print(subtotal(15000, 2))   # 30000
print(subtotal(12000, 3))   # 36000
```

Urutan saat memanggil mengikuti urutan parameter: `15000` masuk ke `harga`, `2` masuk ke `jumlah`.

## Hasil fungsi adalah nilai biasa

Nilai dari `return` bisa disimpan, dihitung lagi, atau langsung dimasukkan ke f-string:

```python
total = subtotal(15000, 2) + subtotal(18000, 1)
print(f"Total: Rp{total}")   # Total: Rp48000
```

Fungsi yang tidak punya `return` mengembalikan `None`. Kalau hasilmu tampil sebagai `None`, biasanya `return`-nya terlupa.

## Fungsi yang mengembalikan teks

Bu Rina ingin harga ditulis dengan titik ribuan, misalnya `Rp15.000`. Format `:,` memberi pemisah koma, lalu `.replace` menukarnya dengan titik:

```python
def rupiah(angka):
    return "Rp" + f"{angka:,}".replace(",", ".")

print(rupiah(1250000))   # Rp1.250.000
```

Sekali ditulis, `rupiah` bisa dipakai di seluruh program. Kalau formatnya berubah, cukup satu tempat yang diperbaiki.
