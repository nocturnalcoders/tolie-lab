---
title: Fungsi yang memanggil fungsi
---
Satu fungsi sebaiknya mengerjakan **satu hal kecil**. Pekerjaan besar lalu disusun dari fungsi-fungsi kecil itu, seperti Bu Rina menyusun pesanan dari beberapa menu.

## Menyusun fungsi

Fungsi boleh memanggil fungsi lain:

```python
def subtotal(harga, jumlah):
    return harga * jumlah

def rupiah(angka):
    return "Rp" + f"{angka:,}".replace(",", ".")

def baris_struk(nama, harga, jumlah):
    return f"{nama} x{jumlah} = {rupiah(subtotal(harga, jumlah))}"

print(baris_struk("kopi susu", 15000, 2))   # kopi susu x2 = Rp30.000
```

`baris_struk` tidak perlu tahu cara menghitung atau cara menulis rupiah. Ia cukup memanggil fungsi yang sudah ada. Python mengerjakan dari dalam ke luar: `subtotal` dulu, hasilnya masuk ke `rupiah`.

## Nilai bawaan

Sebagian besar pembeli bukan anggota, jadi diskonnya `0`. Supaya tidak perlu ditulis terus, beri parameter itu **nilai bawaan**:

```python
def hitung_bayar(total, persen_diskon=0):
    return total * (100 - persen_diskon) // 100

print(hitung_bayar(50000))       # 50000, diskon memakai nilai bawaan 0
print(hitung_bayar(50000, 10))   # 45000
```

Parameter yang punya nilai bawaan harus ditulis **setelah** parameter yang tidak punya.

## Menyebut nama parameter

Saat memanggil, nama parameter boleh disebut supaya lebih jelas dibaca:

```python
print(hitung_bayar(50000, persen_diskon=10))   # 45000
```
