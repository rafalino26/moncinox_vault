// Render a code-native monogram; uses the Sharp renderer already shipped with Next.js.
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#f0e5fc"/>
  <circle cx="256" cy="256" r="179" fill="#e7d5f6"/>
  <g fill="none" stroke="#75439b" stroke-width="27" stroke-linecap="round" stroke-linejoin="round">
    <path d="M151 300V204Q151 188 163 201L210 257L256 201Q269 187 269 204V300"/>
    <path d="M300 213L326 295Q331 310 337 295L364 213"/>
  </g>
  <path d="M255 125l7 17 18 7-18 7-7 18-7-18-18-7 18-7z" fill="#aa80c6"/>
  <path d="M216 350q40 22 80 0" fill="none" stroke="#b99ad2" stroke-width="10" stroke-linecap="round"/>
</svg>`);

async function main() {
  const output = path.resolve(__dirname, '../public/icons');
  await fs.mkdir(output, { recursive: true });
  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await sharp(svg).resize(size, size).png().toFile(path.join(output, name));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
