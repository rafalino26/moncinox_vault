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

## Tambah transaksi offline

- Form tambah transaksi (pengeluaran/tabungan) menyimpan ke database IndexedDB terpisah `moncinox-outbox` sebelum ditutup. Jalur online memakai antrean yang sama sehingga kegagalan respons server tidak menyebabkan pengiriman baru dengan ID berbeda.
- Antrean terlihat di banner atas dengan jumlah, nominal, pemilik, status menunggu/perlu diperiksa dan pesan error. Antrean tidak dimasukkan ke saldo/ringkasan server; total yang menunggu ditampilkan terpisah untuk menghindari saldo ganda saat server sudah menerima tetapi respons belum diterima HP.
- Sinkronisasi berjalan saat aplikasi dibuka, koneksi kembali, focus/visible, setiap 30 detik saat terlihat, atau tombol coba sinkronkan. Aplikasi perlu dibuka agar sinkronisasi berjalan; tidak menjanjikan pengiriman ketika aplikasi ditutup.
- Endpoint `/api/web/offline-transactions` menerima UUID stabil dan payload yang sama pada retry. PostgreSQL advisory transaction lock menserialisasi ID yang sama. Receipt, catatan dan pengurangan saldo committed atomik. Receipt bertahan setelah catatan dihapus, sehingga replay tidak menghidupkan transaksi kembali. Payload berbeda untuk UUID yang sama ditolak 409. API ini mengikuti model akses tanpa login yang sudah dipilih untuk proyek.
- Kegagalan jaringan/503 mempertahankan antrean dan dicoba lagi. 400/409 ditandai perlu diperiksa tanpa loop otomatis; tersedia retry manual per catatan dengan ID yang sama. Belum ada edit/hapus antrean. Data invalid tidak dikirim dan tidak dihapus diam-diam. Kegagalan penyimpanan lokal tidak menampilkan sukses.
- Setelah server mengonfirmasi, resource saldo/riwayat mengabaikan GET lama yang masih berjalan dan membaca keadaan committed sebelum menghapus antrean. Jika refresh atau penghapusan lokal gagal, ID tetap dipertahankan untuk retry idempoten.
- Outbox terpisah dari salinan baca: tombol hapus salinan offline tidak menghapus transaksi yang menunggu. Menghapus seluruh site data browser/uninstall dapat menghapus antrean; sinkronkan dulu sebelum tindakan tersebut. Tidak ada pengiriman ke penyedia lain.
- Database memerlukan migration `20261125000000_offline_transaction_receipts` melalui `npx prisma migrate deploy` sebelum menjalankan versi ini di environment baru. Migration sudah diterapkan pada database yang dikonfigurasi saat implementasi, tanpa mengubah tabel/data transaksi sebelumnya. Build tidak menjalankan migration otomatis.

## Batas saat ini

Edit, hapus, serta tambah/hapus pemasukan tetap perlu internet. Saldo tersimpan adalah salinan terakhir, bukan jaminan saldo terbaru dari perangkat pasangan. Pengeluaran/tabungan baru bisa ditambahkan offline lewat antrean di atas.

Dataset tersimpan hanya setelah pernah berhasil dimuat: dashboard menyimpan wallets/transactions; buka halaman pemasukan saat online untuk menyimpan income. Tidak ada request semua riwayat tambahan pada startup. Snapshot ditimpa saat diperbarui (bukan ditumpuk). Data tidak dikirim ke penyedia lain. Pembaca offline menyediakan tombol menghapus salinan lokal; menghapus site data browser juga menghapusnya. Data tersimpan di perangkat tanpa enkripsi aplikasi tambahan, mengikuti model akses proyek saat ini yang belum memakai akun/login. Jika login ditambahkan, storage harus dipisah per akun dan dibersihkan saat logout.

Jika storage diblokir/penuh, aplikasi online tetap berjalan; pembaca offline menjelaskan data yang tidak tersedia. Cache browser/IndexedDB bisa dihapus perangkat atau pengguna. Pemasangan tidak mempercepat query server.

Worker baru menunggu jendela lama ditutup sebelum aktif; tidak ada reload otomatis saat pengguna sedang mengisi form. Cache browser dapat dihapus oleh pengguna/perangkat. Instalasi worker baru berhasil hanya bila semua aset shell selesai diunduh; jika gagal, worker lama tetap tersedia. Perubahan akun/login di masa depan juga harus mempertahankan aturan bahwa HTML shell tidak mengandung data personal.

## Verifikasi

1. `npm run typecheck` dan `npm test`.
2. `npm run build`, lalu `npm start` (bukan dev). Atau gunakan `NEXT_DIST_DIR` yang sama untuk build/start terpisah. Jangan melewati generator post-build: jika menjalankan `next build` langsung, lanjutkan dengan `node scripts/generate-pwa-shell.cjs` sebelum start/deploy.
3. Buka production HTTPS atau localhost. DevTools Application: periksa manifest, ikon, worker aktif, scope `/`, dan cache `moncinox-pwa-*`.
4. Buka dashboard, pengeluaran, dan pemasukan saat online; tunggu data selesai dimuat dan worker selesai memasang cache. Tutup semua jendela aplikasi lalu buka kembali untuk aktivasi. Aktifkan mode pesawat dan muat ulang `/`, `/pengeluaran`, `/pemasukan`: UI normal harus muncul dengan salinan data dan banner offline. Uji perpindahan tab, pencarian/filter/pagination, grafik yang belum dibuka, font/avatar/sticker, serta dataset kosong atau belum pernah dimuat. Edit/hapus/pemasukan offline harus ditolak; tambah transaksi harus masuk antrean lokal.
5. Online kembali: “Coba buka lagi” mengakses dashboard. API harus tetap melewati network dan tidak muncul dalam Cache Storage.
6. Uji pemasangan Chrome Android dan Safari iPhone melalui menu Bagikan → Add to Home Screen. Periksa ikon, standalone, safe area, modal, dan navigasi. HTTP LAN biasa tidak cukup untuk pengujian worker pada HP; gunakan HTTPS.
7. Deploy versi baru saat form terbuka: tidak boleh memuat ulang tab secara otomatis. Tutup seluruh jendela app, buka kembali untuk mengaktifkan worker baru.
8. Buat/edit/hapus transaksi saat online, tunggu sebentar, tutup aplikasi lalu buka offline: salinan harus mengikuti respons committed terakhir. Uji tombol hapus salinan lokal: server tidak berubah, pembaca offline kembali ke keadaan belum tersedia.
9. Tambahkan beberapa pengeluaran/tabungan offline, tutup/buka aplikasi dan pastikan antrean tetap ada. Online kembali, pastikan tiap catatan muncul sekali, saldo berkurang sekali, dan antrean habis. Putuskan koneksi saat pengiriman; nyalakan lagi lalu ulangi. Uji dua tab/perangkat serta retry manual. Jangan menekan tambah baru untuk menggantikan catatan yang sudah diantrekan.
10. `node --env-file=.env tests/offline-delivery.integration.cjs` memeriksa PostgreSQL asli memakai dompet fixture unik dalam satu transaksi yang selalu di-rollback. Tidak memakai dompet pengguna. Mencakup advisory lock, receipt, replay duplikat dan replay setelah delete.

Tes otomatis mencakup manifest/ukuran ikon, batas cache aset, fallback navigasi, pembersihan versi cache, bypass API/mutasi/RSC, restore snapshot, perlombaan disk/network/mutation, reconnect, validasi snapshot, dan kegagalan storage. Tes ini bukan pengganti verifikasi pada perangkat fisik.
