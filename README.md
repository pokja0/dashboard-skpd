# Dashboard Kinerja Kepala Perangkat Daerah 2026

Dashboard ringkasan dan rincian kinerja kepala Perangkat Daerah Pemerintah Provinsi
Sulawesi Barat. Sumber data: **Rekap Tim Staf Sekda**.

## Isi

- **Ringkasan** — tiga indikator utama, tren bulanan, prioritas tindak lanjut, tujuan
  perjalanan dinas, dan peringkat Perangkat Daerah.
- **Daftar Perangkat Daerah** — pencarian, filter kelompok, filter periode, nomor urut,
  pengurutan per kategori, serta unduhan PDF dan XLSX.
- **Detail unit** — komposisi kehadiran, tren bulanan, grafik tujuan perjalanan,
  daftar lengkap disposisi, perjalanan, dan kehadiran, serta unduhan PDF dan XLSX.
- **Metodologi** — definisi indikator, periode, dan catatan data.
- **Login** — menu Perangkat Daerah hanya dapat diakses akun yang dibuat superadmin.
- **Superadmin** — pembuatan akun, catatan kualitas data, dan data mentah spreadsheet.
- Tampilan responsif dan mode terang/gelap.

## Menjalankan

```bash
bun install
bun run dev
```

Buka alamat yang ditampilkan Vite. Untuk build produksi:

```bash
bun run build
bun run start
```

Aplikasi memakai `@sveltejs/adapter-node`, sehingga build menghasilkan server Node di
`build/`. Jalankan dari direktori proyek agar folder `data/` dapat ditemukan.

## Akun dan akses

Saat pertama kali dijalankan, aplikasi membuat satu akun superadmin:

- Username: `diskusidc6`
- Kata sandi: `Sulbar2026!`

Segera ganti kata sandi bawaan dengan mengatur variabel lingkungan sebelum menjalankan
aplikasi pertama kali, lalu hapus `data/accounts.json` agar akun dibuat ulang:

| Variabel | Fungsi |
| --- | --- |
| `SUPERADMIN_USERNAME` | Username superadmin (default `diskusidc6`) |
| `SUPERADMIN_PASSWORD` | Kata sandi superadmin (default `Sulbar2026!`) |
| `AUTH_SECRET` | Kunci tanda tangan cookie sesi; wajib diatur di produksi |
| `ACCOUNTS_FILE` | Lokasi berkas akun (default `data/accounts.json`) |
| `REKAP_CSV` | Lokasi CSV mentah (default `data/rekap-tim-staf-sekda.csv`) |

Superadmin dapat membuat akun pengguna biasa melalui halaman **Admin**. Akun pengguna
hanya dapat membuka menu Perangkat Daerah dan tidak dapat mengakses halaman Admin.

## Data

Data mentah: `data/rekap-tim-staf-sekda.csv`  
Data olahan: `src/lib/data/rekap.json`

Kehadiran dihitung dari status **Hadir, Diwakili, Dinas Luar, dan Sakit**. Rincian seluruh
status tetap ditampilkan pada halaman detail unit. Nilai Reward & Punishment dihitung dengan
rumus `((persentase kehadiran + persentase disposisi) / 2) x 30%` dan hanya diberikan kepada
unit yang memiliki data disposisi.

Untuk membangun ulang data olahan (butuh Python 3):

```bash
bun run data:build
```

Skrip pengolahan ada di `scripts/build_data.py` dan hanya memakai pustaka standar
Python. Skrip menormalkan nama unit, membersihkan duplikat, memperbaiki tanggal, lalu
menulis JSON yang dipakai aplikasi. Catatan perbaikan (baris duplikat, tanggal salah,
baris tanpa nama, baris non-SKPD) ikut ditulis ke `rekap.json` dan ditampilkan pada
halaman superadmin.

## Teknologi

- SvelteKit 3 + Svelte 5
- Vite
- Bun
- `@sveltejs/adapter-node`
- Autentikasi: cookie sesi bertanda tangan, kata sandi di-hash dengan scrypt
- Grafik SVG tanpa pustaka chart tambahan
- Unduhan PDF: jsPDF + jspdf-autotable
- Unduhan XLSX: SheetJS
- Font lokal: Plus Jakarta Sans dan Bricolage Grotesque

## Logo

Lambang Provinsi Sulawesi Barat, digunakan sebagai identitas pemerintah daerah pada
header dan footer.
