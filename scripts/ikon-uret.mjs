/**
 * Site simgelerini üretir (`public/icon-192.png`, `public/apple-touch-icon.png`).
 *
 * Simge, başlıktaki logonun aynısıdır: `src/lib/ikonlar.ts` içindeki `balik`
 * yolu, `--accent` zemin üstünde beyaz. Logo değişirse burayı bir kez çalıştır.
 *
 * Derlemenin parçası değildir; PNG'ler depoda durur. Tarayıcı gerektirdiği için
 * bağımlılığı isteğe bağlı tutuyoruz:
 *
 *   npm i -D playwright-core && npx playwright install chromium
 *   node scripts/ikon-uret.mjs
 */

import { readFile } from 'node:fs/promises';

const ACCENT = '#9184d9';

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error(
    'playwright-core kurulu değil. Simgeleri yeniden üretmek için:\n'
    + '  npm i -D playwright-core && npx playwright install chromium',
  );
  process.exit(1);
}

/** İkon yolunu tek kaynaktan oku — simge ile logo ayrışmasın. */
const kaynak = await readFile('src/lib/ikonlar.ts', 'utf8');
const eslesme = kaynak.match(/\n\s*balik:\s*'([^']*)'/);
if (!eslesme) throw new Error('src/lib/ikonlar.ts içinde `balik` yolu bulunamadı.');
const BALIK = eslesme[1];

function sayfa(boyut, oran) {
  const ic = Math.round(boyut * oran);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0}
    body{width:${boyut}px;height:${boyut}px;background:${ACCENT};
      display:flex;align-items:center;justify-content:center}
    svg{width:${ic}px;height:${ic}px;display:block}
  </style></head><body>
    <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round" color="#ffffff">${BALIK}</svg>
  </body></html>`;
}

const ISLER = [
  // SVG favicon'u desteklemeyen tarayıcılar için PNG karşılığı.
  ['public/icon-192.png', 192, 0.68],
  // iOS'ta yer imi simgesi: şeffaflık yok, köşeleri iOS kendi yuvarlar.
  ['public/apple-touch-icon.png', 180, 0.68],
];

const tarayici = await chromium.launch();
for (const [yol, boyut, oran] of ISLER) {
  const ctx = await tarayici.newContext({ viewport: { width: boyut, height: boyut }, deviceScaleFactor: 1 });
  const sekme = await ctx.newPage();
  await sekme.setContent(sayfa(boyut, oran));
  await sekme.screenshot({ path: yol });
  await ctx.close();
  console.log(`${yol} · ${boyut}px`);
}
await tarayici.close();
