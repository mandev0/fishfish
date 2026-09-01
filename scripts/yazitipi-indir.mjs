/**
 * Inter'i Google Fonts'tan indirip `public/fonts/` içine yazar ve
 * `src/styles/inter.css` içindeki `@font-face` bloklarını üretir.
 *
 * Derlemenin parçası değildir; dosyalar depoda durur. Sebep: çalışma anında
 * `fonts.googleapis.com`'a gitmek derlemeyi ağa bağımlı kılıyor ve CDN
 * yavaşladığında yazı tipini düşürüyor. Yalnızca Inter sürümü
 * yükseltilecekse elle çalıştır:
 *
 *   npm run yazitipi:indir
 */

import { writeFile } from 'node:fs/promises';

const KAYNAK = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
// Türkçe için latin-ext zorunlu: ğ ş İ ı bu aralıkta.
const ALTKUMELER = new Set(['latin', 'latin-ext']);
// Google altküme listesini User-Agent'a göre veriyor; woff2 için modern bir tarayıcı taklit ediliyor.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const css = await (await fetch(KAYNAK, { headers: { 'User-Agent': UA } })).text();

const bloklar = [...css.matchAll(/\/\* (\S+) \*\/\s*@font-face \{(.*?)\}/gs)];
const yuzler = [];

for (const [, altkume, govde] of bloklar) {
  if (!ALTKUMELER.has(altkume)) continue;
  const agirlik = govde.match(/font-weight: (\d+)/)[1];
  const adres = govde.match(/url\((https:\/\/[^)]+)\)/)[1];
  const aralik = govde.match(/unicode-range: ([^;]+);/)[1].trim();
  const dosya = `inter-${agirlik}-${altkume}.woff2`;
  const veri = Buffer.from(await (await fetch(adres)).arrayBuffer());
  await writeFile(`public/fonts/${dosya}`, veri);
  yuzler.push({ agirlik, dosya, aralik, boyut: veri.length });
  console.log(`public/fonts/${dosya} · ${(veri.length / 1024).toFixed(1)} KB`);
}

if (yuzler.length === 0) throw new Error('Google Fonts yanıtından hiç @font-face çıkmadı.');

const baslik = `/* ---------------------------------------------------------------
   Inter — Nocturne'ün gövde ve başlık yüzü.

   Google Fonts'tan çalışma anında değil, depodan servis ediliyor:
   \`@import url(fonts.googleapis.com)\` derlemeyi ağa bağımlı kılar ve CDN
   yavaşladığında yazı tipini düşürür. Dosyalar \`public/fonts/\` içinde durur;
   \`npm run yazitipi:indir\` ile yenilenir.

   latin-ext altkümesi Türkçe için zorunlu: ğ ş İ ı bu aralıkta.
--------------------------------------------------------------- */`;

const govde = yuzler.map((y) => `@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: ${y.agirlik};
  font-display: swap;
  src: url('/fonts/${y.dosya}') format('woff2');
  unicode-range: ${y.aralik};
}`).join('\n');

await writeFile('src/styles/inter.css', `${baslik}\n${govde}\n`);
console.log(`src/styles/inter.css · ${yuzler.length} yüz · toplam ${(yuzler.reduce((t, y) => t + y.boyut, 0) / 1024).toFixed(0)} KB`);
