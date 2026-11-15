# tolie.space Lab

Platform belajar coding: kursus gratis dengan latihan kode yang berjalan **di browser peserta** (Python lewat Pyodide, SQL lewat SQLite, JavaScript langsung), soal **pilihan ganda** yang dinilai di server, kemajuan per pelajaran (lentera yang menyala), dan akun. Ini tahap 1 dari dokumen desain.

Tumpukan: React + Vite, Flask, PostgreSQL, semuanya di Docker Compose. Kode peserta tidak pernah berjalan di server.

## Yang sudah ada

- Akun (daftar, masuk, keluar), sesi aman, batas percobaan login, dan **atur ulang password** lewat email.
- Katalog kursus, halaman kursus, halaman pelajaran dengan editor kode (CodeMirror) dan tes otomatis.
- Dua jenis latihan: **kode** (Python, SQL, atau JavaScript, dijalankan di browser, dengan **petunjuk bertahap**) dan **pilihan ganda** (satu atau banyak jawaban benar; jawaban benar tidak dikirim sebelum dijawab).
- Kemajuan, kode yang tersimpan otomatis, **runtun belajar** harian, dan penguncian modul berbayar di sisi server.
- **Pembayaran modul berbayar lewat Stripe Checkout** (mati sampai kuncinya diisi).
- **Sertifikat penyelesaian** dari tolie.space dengan tanda tangan Christianto Lie: PDF, nomor unik, kode QR, dan halaman verifikasi publik.
- **Perks gratis dan berbayar**: perbandingan paket di halaman depan dan daftar manfaat di tiap kursus, semuanya bisa diedit tanpa kode.
- **Admin di situs**: ringkasan angka (pendaftar, peserta aktif, pelajaran yang ditinggalkan, latihan tersulit), tambah dan edit kursus, pelajaran, soal pilihan ganda, dan latihan kode; beri akses modul; cabut sertifikat.
- **Dua bahasa, Indonesia dan Inggris**: tombol ID/EN di header, pesan dari server, perbandingan paket, sertifikat PDF, dan dua kursus (Python Dasar untuk Warung Kopi, dan Python Basics for a Coffee Shop).
- **13 kursus gratis**, semuanya dalam bahasa Indonesia dan Inggris (satu kursus, dua bahasa):
  - Python: Dasar, Lanjutan, Berorientasi Objek, Tanggal dan Waktu, Logika dan Algoritma, Mengolah JSON.
  - SQL: Dasar, Lanjutan, Merancang Tabel dan Mengubah Data.
  - JavaScript: Dasar, Lanjutan.
  - Java Dasar dan Kotlin Dasar: kursus membaca kode dengan soal pilihan ganda (kedua bahasa ini tidak dijalankan di browser).
  - Seluruhnya 140 latihan kode dan 120 soal pilihan ganda. Semua solusi dan kode awal, di kedua bahasa, diuji dengan Python, SQLite, dan JavaScript sungguhan.
- Cadangan database otomatis tiap malam, dan CI (GitHub Actions) yang menjalankan semua tes di setiap push.

## Belum ada (tahap berikutnya)

Buy Me a Coffee, pengembalian dana otomatis (refund dilakukan di dashboard Stripe; akses dicabut manual), dan menjalankan Java atau Kotlin (butuh server penilai seperti Judge0). Lihat dokumen desain.

## Pasang di droplet

Di Web Console sebagai root, di droplet yang sama dengan blog dan bot (tidak menyentuh keduanya):

```bash
cd /opt
git clone https://github.com/nocturnalcoders/tolie-lab.git
cd tolie-lab
bash deploy/setup.sh            # membuat .env (password database dan kunci rahasia acak)
docker compose up -d --build    # build pertama beberapa menit
docker compose ps               # db, api, web harus healthy
curl -s http://127.0.0.1:8789/healthz     # harus mencetak: ok
python3 deploy/patch_caddy.py   # menyambungkan lab.tolie.space ke port 8789
```

`patch_caddy.py` mencadangkan Caddyfile, memeriksa konfigurasi baru, me-reload hanya bila valid, dan mengembalikan yang lama bila gagal. Blok situs lain tidak disentuh.

Daftar ke situsnya, lalu jadikan akunmu admin (menu Admin muncul di pojok kanan atas):

```bash
docker compose exec api python manage.py make-admin emailmu@contoh.com
```

Pembaruan: `bash deploy/deploy.sh` (git pull lalu build ulang). Setelah pembaruan yang membawa fitur atur ulang password, semua peserta perlu masuk sekali lagi (sesi sekarang terikat pada password).

### Cadangan database

```bash
bash deploy/install-cron.sh     # sekali saja: cadangan tiap malam pukul 03.15 ke backups/ (14 terakhir disimpan)
bash deploy/backup.sh           # cadangan sekarang juga
```

Hasil tiap malam tercatat di `backups/backup.log`. Supaya cadangan juga tersalin ke luar droplet, pasang [rclone](https://rclone.org), atur satu remote (`rclone config`), lalu isi `BACKUP_RCLONE_REMOTE=namaremote:folder` di `.env`. Tanpa itu, salin sendiri file di `backups/` secara berkala: cadangan yang hanya ada di droplet ikut hilang kalau dropletnya hilang.

### Batas sumber daya

Setiap container dibatasi memorinya (db 384 MB, api 384 MB, web 96 MB) dan lognya diputar (3 x 10 MB), supaya bot di droplet yang sama tidak kekurangan RAM.

### Email verifikasi (opsional)

Awalnya mati (`LAB_EMAIL_VERIFICATION=0`, semua akun langsung terverifikasi). Untuk menyalakannya isi di `.env`:

```
LAB_EMAIL_VERIFICATION=1
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_USER=hi@tolie.space
SMTP_PASS=...
SMTP_FROM=hi@tolie.space
```

lalu `docker compose up -d`. Sertifikat nanti akan butuh email yang terverifikasi.

### Atur ulang password

Tautan "Lupa password?" di halaman masuk mengirim email berisi tautan sekali pakai (berlaku 1 jam). Ini butuh pengaturan SMTP di atas (`LAB_EMAIL_VERIFICATION` boleh tetap 0). Jawaban halaman itu selalu sama, jadi tidak membocorkan email mana yang terdaftar. Setelah password diganti, semua perangkat lain yang masih masuk otomatis keluar.

Kalau SMTP belum diatur, buat tautannya sendiri lalu kirim ke peserta:

```bash
docker compose exec api python manage.py reset-link emailpeserta@contoh.com
```

### Pembayaran (opsional)

Modul dengan `price_idr` lebih dari 0 bisa dibeli lewat Stripe Checkout: peserta membayar di halaman Stripe, lalu Stripe memberi tahu server (webhook) dan aksesnya terbuka. Data kartu tidak pernah menyentuh server ini. Selama kuncinya kosong, halaman modul hanya menulis "Pembelian akan dibuka segera".

1. Di dashboard Stripe, ambil **Secret key** (mulai dengan mode tes, `sk_test_...`).
2. Di Developers → Webhooks, tambah endpoint `https://lab.tolie.space/api/stripe/webhook` dengan event `checkout.session.completed` dan `checkout.session.async_payment_succeeded`, lalu salin **Signing secret** (`whsec_...`).
3. Isi di `.env`, lalu `docker compose up -d`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Coba sekali di mode tes dengan kartu `4242 4242 4242 4242` sebelum memakai kunci live, dan periksa di dashboard Stripe bahwa jumlah yang ditagih sama dengan harga modul. Akun Stripe-mu harus bisa menerima pembayaran dalam rupiah (IDR). Pembelian tercatat di tabel `orders` dan jumlahnya tampil di ringkasan admin.

## Dua bahasa

- **Tampilan:** tombol ID / EN di header. Pilihan disimpan di browser. Kalau belum memilih, browser berbahasa Indonesia mendapat Indonesia dan yang lain mendapat Inggris.
- **Pesan dari server** (galat, email verifikasi) mengikuti bahasa yang dipilih: frontend mengirim header `X-Lang` di setiap permintaan.
- **Satu kursus, dua bahasa.** Kursus ditulis sekali dalam bahasa utamanya (`locale` di `course.yml`) dan bisa membawa terjemahan di folder yang sama (`translations: en:` di `course.yml`, lalu `lesson.en.md` dan `exercises.en.yml` di tiap pelajaran). Ia tetap satu kursus: satu kemajuan, satu sertifikat. Saat pengunjung menekan ID / EN, kursus, pelajaran, dan soal yang sama tampil dalam bahasa itu; kode yang sedang ditulis tidak hilang. Kursus tanpa terjemahan tampil dalam bahasa utamanya, dan di katalog muncul lewat tombol "tampilkan juga kursus dalam bahasa lain".
- **Sertifikat** terbit dalam bahasa yang dipakai peserta saat mengklaimnya, dan tetap dalam bahasa itu. Halaman verifikasi publik memakai bahasa tampilan pengunjung.
- Nama folder kursus, folder pelajaran, dan slug latihan memakai bahasa Inggris (`python-basics`, `01-hello-coffee-shop`, `greet-the-customer`), apa pun bahasa tulis kursusnya. Alamat pelajaran jadi sama untuk kedua bahasa.
- Dua kursus lama yang terpisah per bahasa (`python-dasar` dan `python-basics`) sekarang satu kursus, `python-basics`. Saat API pertama kali menyala setelah pembaruan, kemajuan, kode, dan sertifikat peserta `python-dasar` dipindahkan ke pelajaran dan latihan yang sepadan (`replaces:` di `course.yml`), lalu kursus lamanya dihapus. Tautan lama ke `/kursus/python-dasar` tidak berlaku lagi.
- **Perbandingan paket**: `content/plans.yml` punya satu daftar per bahasa (`id:` dan `en:`).
- Antarmuka **admin hanya berbahasa Indonesia**, karena dipakai pemilik situs.

Menambah teks tampilan baru: tulis teks Indonesianya di kode dengan `t('...')`, lalu tambahkan terjemahan Inggrisnya di `frontend/src/locales/en.js`. Tes gagal bila ada teks yang belum punya terjemahan, atau terjemahan yang tidak lagi dipakai. Pesan galat baru dari server ditambahkan ke `backend/i18n.py` dengan cara yang sama.

## Menulis kursus

Panduan lengkap untuk penulis (format, terjemahan, arti `input` di tiap bahasa pemrograman) ada di [`content/README.md`](content/README.md). Ringkasnya:

Semua isi ada di folder `content/`, tanpa admin: tulis, `git push`, lalu di droplet `git pull && docker compose restart api` (tanpa build ulang).

```
content/<kursus>/course.yml                    judul, bahasa pemrograman, locale (id atau en), level, harga (price_idr), status
content/<kursus>/<NN-pelajaran>/lesson.md      front matter (title) lalu materi Markdown
content/<kursus>/<NN-pelajaran>/exercises.yml  daftar latihan
content/<kursus>/<NN-pelajaran>/lesson.en.md, exercises.en.yml   terjemahan (opsional, tapi harus lengkap untuk seluruh kursus)
```

Latihan kode: `slug`, `type: code`, `title`, `prompt`, `starter`, `tests` (daftar `input` dan `output`), `hints`, dan `solution`. `hints` adalah daftar sampai 3 petunjuk yang dibuka peserta satu per satu, dari arahan ringan sampai hampir jawabannya (satu `hint` saja juga boleh). Latihan pilihan ganda: `type: choice`, `options`, `correct` (nomor opsi mulai dari 0), `multiple: true` bila boleh banyak jawaban, `hint`, `explanation`. Contoh lengkap ada di `content/python-basics`.

**Kursus SQL** (`language: sql` di `course.yml`): tiap latihan kode punya `setup`, yaitu SQL (CREATE TABLE dan INSERT) yang dijalankan di database SQLite kosong sebelum setiap tes, dan bisa dilihat peserta. `input` sebuah tes adalah SQL tambahan (misalnya baris baru, supaya jawaban yang ditulis mati gagal), dan `output` adalah tabel hasil: satu baris nama kolom, lalu satu baris per data, dipisah `|`. Selalu minta `ORDER BY` kalau hasilnya lebih dari satu baris. Untuk soal yang mengubah data (INSERT, UPDATE, CREATE TABLE), isi `check`: SQL yang dijalankan setelah jawaban peserta, dan hasilnyalah yang dibandingkan. Contoh ada di `content/sql-basics` dan `content/sql-tables-and-data`.

**Kursus JavaScript** (`language: javascript`): `input` sebuah tes adalah JavaScript yang dijalankan tepat setelah kode peserta, biasanya memanggil fungsi yang diminta, misalnya `console.log(total(15000, 2))`. Keluarannya satu baris per `console.log`.

**Java dan Kotlin** tidak bisa dijalankan di browser, jadi kursusnya hanya memakai soal pilihan ganda (membaca kode: apa yang dicetak, baris mana yang salah). Latihan kode untuk kedua bahasa itu ditolak saat pengecekan.

Sebelum di-push, jalankan pengecekan (ia juga melaporkan file YAML yang rusak). Ia menjalankan `solution` dan `starter` setiap latihan di Python atau SQLite sungguhan: solusi harus lulus semua tes, dan kode awal tidak boleh sudah lulus.

```bash
cd frontend && npm ci && npm run check-content
docker compose exec api python manage.py check-content     # cek format di server
```

Jangan mengganti `slug` pelajaran atau latihan yang sudah dipakai peserta, karena kemajuan terikat pada slug itu. Modul berbayar: isi `price_idr` lebih dari 0. Pelajarannya terkunci sampai ada akses: `docker compose exec api python manage.py grant emailpeserta@contoh.com slug-modul`.

## Admin: menambah soal dari situs

Buka `/admin` (hanya akun admin). Dari sana:

- **Kursus baru** atau ubah pengaturan kursus: judul, bahasa, level, harga, status (draf atau terbit), urutan, daftar manfaat, dan apakah sertifikat diterbitkan.
- **Pelajaran**: tulis materi dalam Markdown dengan pratinjau.
- **Soal pilihan ganda**: pertanyaan, 2 sampai 8 pilihan, tandai jawaban benar (boleh lebih dari satu), petunjuk, dan penjelasan.
- **Ringkasan**: jumlah peserta, pendaftar dan peserta aktif 14 hari terakhir, pelajaran yang banyak dimulai tapi sedikit diselesaikan, dan 10 latihan dengan tingkat kelulusan terendah.
- **Latihan kode**: perintah, kode awal, solusi, petunjuk (satu per baris), dan daftar tes (untuk kursus SQL juga tabel dan datanya). Sebelum disimpan, solusi dijalankan terhadap tesnya di browser kamu: solusi harus lulus semua tes, dan kode awal tidak boleh sudah lulus. Solusi tidak pernah dikirim ke peserta.
- **Beri akses modul** ke seorang peserta lewat email, dan **cabut atau pulihkan sertifikat**.

Soal dan pelajaran yang dibuat atau diubah di admin ditandai `admin`, dan file di `content/` tidak akan menimpanya lagi. Admin menyunting bahasa utama kursus; terjemahan pelajaran atau soal yang kamu ubah di admin dibuang (supaya tidak ada dua versi yang berbeda isi), jadi pengunjung berbahasa Inggris melihat teks bahasa utamanya untuk bagian itu. Yang belum kamu ubah tetap dikelola file. Menghapus pelajaran atau soal yang sudah dijawab peserta meminta konfirmasi, karena kemajuan mereka ikut terhapus.

## Sertifikat

- Terbit setelah semua pelajaran selesai. Peserta menulis nama yang ingin dicetak (terkunci setelah terbit) lalu mengunduh PDF.
- Setiap sertifikat punya nomor acak `LAB-XXXX-XXXX-XXXX`, kode QR, dan halaman `https://lab.tolie.space/verifikasi/<nomor>` yang bisa dibuka siapa saja. Halaman itu menyebut bahwa sertifikat menyatakan penyelesaian kursus, bukan akreditasi.
- Kalau `LAB_EMAIL_VERIFICATION=1`, email harus terverifikasi dulu.
- Tanda tangan ada di `backend/assets/signature.png`. Ganti filenya (PNG transparan) untuk memperbarui tanda tangan di semua sertifikat baru dan yang diunduh ulang.
- Nama dengan huruf di luar Latin (misalnya Mandarin) tercetak sebagai `?`, karena font yang dibundel (DejaVu) tidak memuatnya.
- Sertifikat tidak disimpan sebagai file: PDF dibuat saat diminta dari data di database, jadi selalu cocok dengan datanya. Mencabut sertifikat langsung mematikan PDF-nya.

## Perks gratis dan berbayar

`content/plans.yml` berisi perbandingan paket di halaman depan (nama, harga, kalimat pendek, daftar manfaat, dan `highlight`). Manfaat per kursus ada di `perks:` pada `course.yml`, atau di kolom "Yang didapat peserta" di admin. Teks bawaannya hanya memuat hal yang sudah ada di Lab; ubah sesukamu, lalu `docker compose restart api`.

## Tes

```bash
# backend (butuh PostgreSQL; skema sementara dibuat otomatis)
cd backend && pip install -r requirements.txt
DATABASE_URL=postgresql://lab:lab@localhost:5432/lab python tests/test_api.py

# frontend
cd frontend && npm ci
npm test                  # tampilan, alur latihan, sertifikat, admin, runner (worker palsu)
npm run test:python       # runner Python di Pyodide sungguhan (stdin, error, exit, batas keluaran)
npm run test:sql          # runner SQL di SQLite sungguhan (setup, tabel hasil, error)
npm run test:js           # runner JavaScript (console.log, kode tes, error)
npm run check-content     # solusi semua latihan, kedua bahasa (tambah `-- nama-kursus` untuk satu kursus saja)
```

Semua itu juga dijalankan GitHub Actions di setiap push dan pull request (`.github/workflows/ci.yml`).

## Yang perlu kamu coba di browser setelah pasang

Pengujian otomatis tidak bisa menjalankan browser sungguhan, jadi tiga hal ini perlu dicoba sekali:

1. Buka satu pelajaran, tekan **Periksa jawaban**. Unduhan pertama sekitar 14 MB (Python), setelah itu tersimpan di browser. Indikator di atas editor berubah dari "Memuat Python" ke "Python siap".
   Kalau muncul "Python gagal dimuat", buka konsol browser. Biasanya penyebabnya kebijakan keamanan (CSP) untuk worker di `frontend/worker-security.conf`. Pesan di konsol menyebut aturan yang diblokir.
2. Tulis `while True: pass` lalu **Periksa jawaban**. Setelah sekitar 6 detik harus muncul "Waktu habis", dan tombolnya bisa dipakai lagi.

3. Buka satu pelajaran SQL dan tekan **Periksa jawaban**. Indikatornya harus menjadi "SQL siap". Kalau gagal dimuat, penyebabnya sama seperti nomor 1 (aturan untuk `/sqljs/`).

Juga cek: Tab menjorok di editor, Esc melepas fokus editor, Ctrl+Enter memeriksa, tombol Malam/Siang (atau tombol N), dan klik **Unduh PDF** di sertifikat (PDF harus terbuka di penampil bawaan browser).

## Catatan keamanan

- Akses modul berbayar hanya diberikan oleh webhook Stripe yang tanda tangannya cocok dan jumlahnya sama dengan harga modul. Halaman "kembali dari pembayaran" tidak membuka apa pun.
- Tautan atur ulang password acak, disimpan sebagai hash, berlaku 1 jam, dan sekali pakai. Mengganti password mengeluarkan semua sesi lama.
- Kode peserta berjalan di worker browser dengan kebijakan yang hanya mengizinkan koneksi ke situs ini, jadi tidak bisa mengirim data ke luar.
- Hasil tes kursus gratis dihitung di browser, jadi peserta yang paham bisa memalsukannya, dan tesnya tidak tersembunyi. Karena itu sertifikat kursus gratis nanti hanya menyatakan penyelesaian kursus. Latihan yang dinilai server (Java, modul berbayar) tidak punya batasan ini.
- Jawaban pilihan ganda dinilai di server dan jawaban benar baru dikirim setelah dijawab benar (atau tiga kali salah).
- Isi pelajaran berbayar tidak pernah dikirim tanpa akses.
- Semua jalur admin butuh akun admin dan header CSRF. Solusi latihan kode hanya dikirim ke admin.
- Nomor sertifikat acak (60 bit), dan pemeriksaan publik dibatasi 60 per menit per alamat.
