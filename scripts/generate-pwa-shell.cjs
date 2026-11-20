const fs = require('node:fs/promises');
const path = require('node:path');

async function files(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

async function generate(root = path.resolve(__dirname, '..'), distName = process.env.NEXT_DIST_DIR || '.next') {
  const dist = path.resolve(root, distName);
  const buildId = (await fs.readFile(path.join(dist, 'BUILD_ID'), 'utf8')).trim();
  const manifest = JSON.parse(await fs.readFile(path.join(dist, 'prerender-manifest.json'), 'utf8'));
  const routes = { '/': 'dashboard', '/pengeluaran': 'pengeluaran', '/pemasukan': 'pemasukan' };
  const pages = {};
  await fs.mkdir(path.join(root, 'public/offline-pages'), { recursive: true });
  for (const [route, filename] of Object.entries(routes)) {
    // Only build-time public shells may be cached, never server-rendered financial HTML.
    if (!manifest.routes[route] || manifest.routes[route].initialRevalidateSeconds !== false) {
      throw Error(`Offline shell requires a fully static route: ${route}`);
    }
    const output = `/offline-pages/${filename}.html`;
    await fs.copyFile(path.join(dist, 'server/app', route === '/' ? 'index.html' : `${route.slice(1)}.html`), path.join(root, 'public', output));
    pages[route] = output;
  }
  const staticDir = path.join(dist, 'static');
  const assets = (await files(staticDir)).filter(file => /\.(js|css|woff2?|png|svg|webp|jpe?g)$/.test(file))
    .map(file => `/_next/static/${path.relative(staticDir, file).split(path.sep).join('/')}`);
  const images = new Set();
  for (const file of (await files(path.join(root, 'src'))).filter(file => /\.(tsx?|css)$/.test(file))) {
    const source = await fs.readFile(file, 'utf8');
    for (const match of source.matchAll(/["'`(](\/(?:stickers\/)?[\w.-]+\.(?:png|svg|webp|jpe?g))["'`)]/g)) {
      await fs.access(path.join(root, 'public', match[1]));
      images.add(match[1]);
    }
  }
  const build = { id: buildId, pages, assets: [...new Set([...assets, ...images])].sort() };
  await fs.writeFile(path.join(root, 'public/pwa-build.js'), `// Generated after next build. Do not edit.\nself.MONCINOX_PWA_BUILD = ${JSON.stringify(build)};\n`);
  console.log(`PWA shell ready: ${Object.keys(pages).length} pages, ${build.assets.length} assets, build ${buildId}`);
  return build;
}

module.exports = { generate };
if (require.main === module) generate().catch(error => { console.error(error); process.exitCode = 1; });
