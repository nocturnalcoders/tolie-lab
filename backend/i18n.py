"""Language of the learner-facing API messages.

The site works in Indonesian (id) and English (en). The frontend sends the chosen language in the
X-Lang header. Messages are written in Indonesian in the code; for English they are looked up here
on the way out, so a new message needs one line in EN (a test fails if one is missing).
The admin screens are Indonesian only, so admin messages are not translated.
"""
from __future__ import annotations

LANGS = ("id", "en")

EN = {
    "Masuk dulu untuk melanjutkan.": "Sign in to continue.",
    "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi satu jam lagi.": "Too many sign-ups from this network. Try again in an hour.",
    "Isi namamu (maksimal 60 karakter).": "Enter your name (60 characters at most).",
    "Alamat email tidak valid.": "That email address is not valid.",
    "Password minimal 10 karakter.": "The password needs at least 10 characters.",
    "Password terlalu panjang.": "The password is too long.",
    "Email itu sudah terdaftar. Coba masuk.": "That email is already registered. Try signing in.",
    "Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi.": "Too many attempts. Wait 15 minutes and try again.",
    "Email atau password tidak cocok.": "The email or password does not match.",
    "Tautan verifikasi tidak berlaku lagi. Minta tautan baru dari halaman Belajar Saya.": "This verification link is no longer valid. Ask for a new one on the My Learning page.",
    "Sudah tiga kali dikirim. Coba lagi satu jam lagi.": "Already sent three times. Try again in an hour.",
    "Modul ini berbayar. Buka aksesnya untuk melihat pelajaran.": "This module is paid. Unlock it to see the lessons.",
    "Latihan ini bukan pilihan ganda.": "This exercise is not multiple choice.",
    "Pelan-pelan sebentar, terlalu banyak percobaan dalam semenit.": "Slow down a little, too many attempts in a minute.",
    "Pilih jawabanmu dulu.": "Pick your answer first.",
    "Latihan ini bukan latihan kode.": "This exercise is not a coding exercise.",
    "Hasil tes tidak valid.": "The test result is not valid.",
    "Kode tidak valid.": "The code is not valid.",
    "Pelajaran ini selesai setelah semua latihan wajibnya lulus.": "This lesson is finished once all of its required exercises pass.",
    "Permintaan tidak valid. Muat ulang halaman lalu coba lagi.": "That request was not valid. Reload the page and try again.",
    "Kamu tidak punya akses ke ini.": "You do not have access to this.",
    "Tidak ditemukan.": "Not found.",
    "Data terlalu besar.": "That is too much data.",
    "Terlalu banyak permintaan. Coba lagi sebentar lagi.": "Too many requests. Try again in a moment.",
    "Terjadi kesalahan di server. Coba lagi sebentar lagi.": "Something went wrong on the server. Try again in a moment.",
    "Kursus ini tidak menerbitkan sertifikat.": "This course does not issue certificates.",
    "Sertifikatmu untuk kursus ini sudah dicabut. Hubungi admin.": "Your certificate for this course has been revoked. Contact the admin.",
    "Verifikasi emailmu dulu. Tautannya dikirim saat kamu mendaftar.": "Verify your email first. The link was sent when you signed up.",
    "Selesaikan semua pelajaran dulu. Sertifikat terbit setelah semua lentera menyala.": "Finish all the lessons first. The certificate is issued once every lantern is lit.",
    "Tulis nama lengkapmu untuk sertifikat (2 sampai 80 karakter).": "Write your full name for the certificate (2 to 80 characters).",
    "Sertifikat ini sudah dicabut.": "This certificate has been revoked.",
    "Terlalu banyak permintaan atur ulang password. Coba lagi satu jam lagi.": "Too many password reset requests. Try again in an hour.",
    "Terlalu banyak percobaan. Coba lagi satu jam lagi.": "Too many attempts. Try again in an hour.",
    "Tautan atur ulang password tidak berlaku lagi. Minta tautan baru.": "This password reset link is no longer valid. Ask for a new one.",
    "Menjalankan kode untuk bahasa ini belum dibuka.": "Running code in this language is not open yet.",
    "Jatah menjalankan kode hari ini sudah habis untuk akunmu. Coba lagi besok.": "Your account has used today's code runs. Try again tomorrow.",
    "Jatah harian situs untuk menjalankan kode sudah habis. Coba lagi besok.": "The site has used today's code runs. Try again tomorrow.",
    "Kode belum bisa dijalankan sekarang. Coba lagi sebentar lagi.": "The code could not be run right now. Try again in a moment.",
    "Pembayaran belum dibuka.": "Payments are not open yet.",
    "Kamu sudah punya akses ke modul ini.": "You already have access to this module.",
    "Terlalu banyak percobaan pembayaran. Coba lagi satu jam lagi.": "Too many payment attempts. Try again in an hour.",
    "Pembayaran belum bisa dimulai. Coba lagi sebentar lagi.": "The payment could not be started. Try again in a moment.",
}


def lang_of(req) -> str:
    value = (req.headers.get("X-Lang") or req.args.get("lang") or "id").lower()
    return value if value in LANGS else "id"


def translate(message: str, lang: str) -> str:
    return EN.get(message, message) if lang == "en" else message
