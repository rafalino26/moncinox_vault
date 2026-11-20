# Moncinox PWA

PWA tahap pertama menggunakan manifest bawaan Next.js, service worker kecil tanpa dependency tambahan, dan ikon monogram lilac. Jalankan `node scripts/generate-pwa-icons.cjs` untuk membuat ulang ikon.

## Yang tersedia

- Manifest `/manifest.webmanifest`, ikon 192/512, maskable, dan Apple touch icon.
- Mode standalone serta tombol “Pasang app” pada navbar. Browser yang menyediakan prompt memakai prompt asli; lainnya mendapatkan panduan manual termasuk Safari iPhone/iPad.
- Registrasi service worker hanya pada production dan secure context (HTTPS atau localhost).
- Halaman offline mandiri yang tidak membutuhkan JavaScript/React atau API database.
- Cache hanya untuk aset statis Next.js (maksimum 80 entri) serta aset offline yang masuk daftar eksplisit. API keuangan, POST/Server Actions, HTML halaman aplikasi, dan payload RSC tidak disimpan oleh service worker.
- Pemberitahuan koneksi putus pada aplikasi yang masih terbuka. Data yang sudah ada di memori tetap mengikuti mekanisme cache aplikasi sebelumnya.

## Batas tahap pertama

Ini belum menyediakan riwayat persisten offline atau antrean CRUD offline. Saldo/transaksi tetap membutuhkan internet. Pemasangan tidak membuat database atau query server lebih cepat. Cache aset membantu kunjungan berikutnya; pemasangan pertama dan kesiapan prompt mengikuti browser.

Worker baru menunggu jendela lama ditutup sebelum aktif; tidak ada reload otomatis saat pengguna sedang mengisi form. Ubah `VERSION` di `public/sw.js` jika aset precache atau kebijakan cache berubah. Cache Moncinox versi lama dibersihkan saat aktivasi. Cache browser dapat dihapus oleh pengguna/perangkat.

## Verifikasi

1. `npm run typecheck` dan `npm test`.
2. `npm run build`, lalu `npm start` (bukan dev). Atau gunakan `NEXT_DIST_DIR` yang sama untuk build/start terpisah.
3. Buka production HTTPS atau localhost. DevTools Application: periksa manifest, ikon, worker aktif, scope `/`, dan cache `moncinox-pwa-*`.
4. Setelah worker aktif, matikan jaringan dan muat ulang `/`, `/pengeluaran`, `/pemasukan`: halaman offline harus muncul. Pada tab yang sudah terbuka, indikator offline muncul; penulisan transaksi harus tetap gagal tanpa internet dan tidak menunjukkan sukses palsu.
5. Online kembali: “Coba buka lagi” mengakses dashboard. API harus tetap melewati network dan tidak muncul dalam Cache Storage.
6. Uji pemasangan Chrome Android dan Safari iPhone melalui menu Bagikan → Add to Home Screen. Periksa ikon, standalone, safe area, modal, dan navigasi. HTTP LAN biasa tidak cukup untuk pengujian worker pada HP; gunakan HTTPS.
7. Deploy versi baru saat form terbuka: tidak boleh memuat ulang tab secara otomatis. Tutup seluruh jendela app, buka kembali untuk mengaktifkan worker baru.

Tes otomatis mencakup manifest/ukuran ikon, batas cache aset, fallback navigasi, pembersihan versi cache, dan bypass API/mutasi/RSC. Tes ini bukan pengganti verifikasi pemasangan pada perangkat fisik.
