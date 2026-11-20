const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { generate } = require('../scripts/generate-pwa-shell.cjs');

test('offline build packs actual static pages and all route/font/chart assets, excluding sourcemaps', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'moncinox-pwa-test-'));
  try {
    for (const folder of ['.next/server/app', '.next/static/chunks', '.next/static/media', 'public', 'src']) await fs.mkdir(path.join(root, folder), { recursive: true });
    await fs.writeFile(path.join(root, '.next/BUILD_ID'), 'build-123');
    const routes = Object.fromEntries(['/', '/pengeluaran', '/pemasukan'].map(route => [route, { initialRevalidateSeconds: false }]));
    await fs.writeFile(path.join(root, '.next/prerender-manifest.json'), JSON.stringify({ routes }));
    for (const page of ['index', 'pengeluaran', 'pemasukan']) await fs.writeFile(path.join(root, `.next/server/app/${page}.html`), `<html>${page}</html>`);
    for (const file of ['chunks/app.js', 'chunks/chart.js', 'chunks/app.js.map', 'media/font.woff2']) await fs.writeFile(path.join(root, '.next/static', file), 'asset');
    await fs.writeFile(path.join(root, 'public/rafa.png'), 'image');
    await fs.writeFile(path.join(root, 'src/View.tsx'), '<Image src="/rafa.png" />');
    const build = await generate(root);
    assert.equal(build.id, 'build-123');
    assert.deepEqual(build.pages, { '/': '/offline-pages/dashboard.html', '/pengeluaran': '/offline-pages/pengeluaran.html', '/pemasukan': '/offline-pages/pemasukan.html' });
    assert.deepEqual(build.assets, ['/_next/static/chunks/app.js', '/_next/static/chunks/chart.js', '/_next/static/media/font.woff2', '/rafa.png']);
    assert.equal(await fs.readFile(path.join(root, 'public/offline-pages/dashboard.html'), 'utf8'), '<html>index</html>');
    assert.match(await fs.readFile(path.join(root, 'public/pwa-build.js'), 'utf8'), /MONCINOX_PWA_BUILD/);
    routes['/pemasukan'].initialRevalidateSeconds = 60;
    await fs.writeFile(path.join(root, '.next/prerender-manifest.json'), JSON.stringify({ routes }));
    await assert.rejects(generate(root), /fully static route/);
  } finally {
    // Delete only this test's verified, uniquely created temp directory.
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('moncinox-pwa-test-'));
    await fs.rm(root, { recursive: true, force: true });
  }
});
