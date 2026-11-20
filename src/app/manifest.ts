import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Moncinox Vault',
    short_name: 'Moncinox',
    description: 'Catatan pengeluaran, pemasukan, dan saldo bersama.',
    lang: 'id',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f5efff',
    theme_color: '#f5efff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
