# Moncinox PWA

PWA menggunakan manifest bawaan Next.js, service worker kecil tanpa dependency tambahan, dan ikon monogram lilac. Tahap kedua menambahkan salinan data baca saja di IndexedDB. Jalankan `node scripts/generate-pwa-icons.cjs` untuk membuat ulang ikon.

## Yang tersedia

- Manifest `/manifest.webmanifest`, ikon 192/512, maskable, dan Apple touch icon.
- Mode standalone serta tombol “Pasang app” pada navbar. Browser yang menyediakan prompt memakai prompt asli; lainnya mendapatkan panduan manual termasuk Safari iPhone/iPad.
- Registrasi service worker hanya pada production dan secure context (HTTPS atau localhost).
- Offline menggunakan UI React yang sama dengan dashboard, pengeluaran, dan pemasukan, dengan pemberitahuan “Sedang offline” di atas. Shell HTML statis build, JavaScript (termasuk chunk grafik), CSS, font, logo, avatar, dan sticker yang dipakai diprecache. Pembaca mandiri sebelumnya tetap menjadi fallback untuk rute yang tidak dikenali.
- `npm run build` membuat `/pwa-build.js` dan `/offline-pages/*.html` melalui `scripts/generate-pwa-shell.cjs`. Generator hanya menerima tiga rute yang benar-benar statis menurut prerender manifest; tidak menyimpan HTML hasil request pengguna. File hasil build diabaikan Git. Worker mengimpor identitas build sehingga deployment baru menghasilkan versi cache baru otomatis.
- API keuangan, POST/Server Actions, dan payload RSC tetap melewati jaringan. Cache aset inti dipertahankan untuk satu versi build; cache runtime tambahan dibatasi 80 entri. Optimized image yang gagal di jaringan memakai original artwork lokal. Cache versi lama dibersihkan setelah worker baru aktif.
- Link tab/navbar saat offline menggunakan navigasi dokumen ke shell yang diprecache, menghindari request RSC yang akan gagal. Filter dalam halaman tetap berjalan lokal. Saat online link Next.js berfungsi seperti biasa.
- Salinan data di IndexedDB setelah GET berhasil atau respons CRUD sudah committed. Restore berjalan paralel dengan network sehingga disk tidak menghambat data baru. Restore lambat tidak boleh menimpa hasil network atau mutation baru.
- Waktu pembaruan setiap dataset ditampilkan di pembaca offline; aplikasi utama menampilkan pemberitahuan cache/koneksi dengan waktu paling lama dari dataset yang sedang tersedia.

## Batas tahap kedua

Tidak ada antrean CRUD offline. Form tambah/edit/hapus menolak submit saat browser menyatakan offline; kegagalan jaringan lainnya tetap mengikuti penanganan error biasa. Saldo tersimpan adalah salinan terakhir, bukan jaminan saldo terbaru dari perangkat pasangan.

Dataset tersimpan hanya setelah pernah berhasil dimuat: dashboard menyimpan wallets/transactions; buka halaman pemasukan saat online untuk menyimpan income. Tidak ada request semua riwayat tambahan pada startup. Snapshot ditimpa saat diperbarui (bukan ditumpuk). Data tidak dikirim ke penyedia lain. Pembaca offline menyediakan tombol menghapus salinan lokal; menghapus site data browser juga menghapusnya. Data tersimpan di perangkat tanpa enkripsi aplikasi tambahan, mengikuti model akses proyek saat ini yang belum memakai akun/login. Jika login ditambahkan, storage harus dipisah per akun dan dibersihkan saat logout.

Jika storage diblokir/penuh, aplikasi online tetap berjalan; pembaca offline menjelaskan data yang tidak tersedia. Cache browser/IndexedDB bisa dihapus perangkat atau pengguna. Pemasangan tidak mempercepat query server.

Worker baru menunggu jendela lama ditutup sebelum aktif; tidak ada reload otomatis saat pengguna sedang mengisi form. Cache browser dapat dihapus oleh pengguna/perangkat. Instalasi worker baru berhasil hanya bila semua aset shell selesai diunduh; jika gagal, worker lama tetap tersedia. Perubahan akun/login di masa depan juga harus mempertahankan aturan bahwa HTML shell tidak mengandung data personal.

## Verifikasi

1. `npm run typecheck` dan `npm test`.
2. `npm run build`, lalu `npm start` (bukan dev). Atau gunakan `NEXT_DIST_DIR` yang sama untuk build/start terpisah. Jangan melewati generator post-build: jika menjalankan `next build` langsung, lanjutkan dengan `node scripts/generate-pwa-shell.cjs` sebelum start/deploy.
3. Buka production HTTPS atau localhost. DevTools Application: periksa manifest, ikon, worker aktif, scope `/`, dan cache `moncinox-pwa-*`.
4. Buka dashboard, pengeluaran, dan pemasukan saat online; tunggu data selesai dimuat dan worker selesai memasang cache. Tutup semua jendela aplikasi lalu buka kembali untuk aktivasi. Aktifkan mode pesawat dan muat ulang `/`, `/pengeluaran`, `/pemasukan`: UI normal harus muncul dengan salinan data dan banner offline. Uji perpindahan tab, pencarian/filter/pagination, grafik yang belum dibuka, font/avatar/sticker, serta dataset kosong atau belum pernah dimuat. Submit tambah/edit/hapus harus ditolak tanpa sukses palsu.
5. Online kembali: “Coba buka lagi” mengakses dashboard. API harus tetap melewati network dan tidak muncul dalam Cache Storage.
6. Uji pemasangan Chrome Android dan Safari iPhone melalui menu Bagikan → Add to Home Screen. Periksa ikon, standalone, safe area, modal, dan navigasi. HTTP LAN biasa tidak cukup untuk pengujian worker pada HP; gunakan HTTPS.
7. Deploy versi baru saat form terbuka: tidak boleh memuat ulang tab secara otomatis. Tutup seluruh jendela app, buka kembali untuk mengaktifkan worker baru.
8. Buat/edit/hapus transaksi saat online, tunggu sebentar, tutup aplikasi lalu buka offline: salinan harus mengikuti respons committed terakhir. Uji tombol hapus salinan lokal: server tidak berubah, pembaca offline kembali ke keadaan belum tersedia.

Tes otomatis mencakup manifest/ukuran ikon, batas cache aset, fallback navigasi, pembersihan versi cache, bypass API/mutasi/RSC, restore snapshot, perlombaan disk/network/mutation, reconnect, validasi snapshot, dan kegagalan storage. Tes ini bukan pengganti verifikasi pada perangkat fisik.
