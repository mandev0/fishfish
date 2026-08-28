/**
 * Derleme sonrası adımı: service worker'ın önbelleğe alacağı dosya listesini
 * çıkarır ve sürüm damgasını `dist/sw.js` içine yazar.
 *
 * Sürüm, çıktının içerik özetidir. Çıktı değişmediyse damga da değişmez ve
 * tarayıcı boşuna yeniden kurulum yapmaz; bir sayfa değiştiyse damga değişir
 * ve service worker kendini günceller.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
/** Bunlar önbelleğe alınmaz: service worker kendini ve listesini önbellekleyemez. */
const HARIC = new Set(['sw.js', 'sw-liste.json']);

async function dosyalariTopla(kok) {
  const bulunan = [];
  async function gez(dizin) {
    for (const oge of await readdir(dizin, { withFileTypes: true })) {
      const tam = join(dizin, oge.name);
      if (oge.isDirectory()) await gez(tam);
      else bulunan.push(tam);
    }
  }
  await gez(kok);
  return bulunan.sort();
}

/** dist yolunu siteye ait URL'ye çevirir; `/x/index.html` → `/x`, kök → `/`. */
function urlYap(dosya) {
  const gorece = relative(DIST, dosya).split(sep).join('/');
  if (gorece === 'index.html') return '/';
  if (gorece.endsWith('/index.html')) return '/' + gorece.slice(0, -'/index.html'.length);
  return '/' + gorece;
}

const dosyalar = await dosyalariTopla(DIST);
const ozet = createHash('sha256');
let toplamBayt = 0;
const yollar = [];

for (const dosya of dosyalar) {
  const gorece = relative(DIST, dosya).split(sep).join('/');
  if (HARIC.has(gorece)) continue;
  const icerik = await readFile(dosya);
  // Yol da özete girsin: yalnızca dosya adı değişen bir derleme de sürümü değiştirsin.
  ozet.update(gorece).update(icerik);
  toplamBayt += icerik.length;
  yollar.push(urlYap(dosya));
}

const surum = ozet.digest('hex').slice(0, 12);

await writeFile(
  join(DIST, 'sw-liste.json'),
  JSON.stringify({ surum, olusturma: new Date().toISOString(), dosyalar: yollar }, null, 0),
);

const swYolu = join(DIST, 'sw.js');
const sw = await readFile(swYolu, 'utf8');
if (!sw.includes('__SURUM__')) {
  throw new Error('dist/sw.js içinde __SURUM__ yer tutucusu yok — public/sw.js bozulmuş olabilir.');
}
await writeFile(swYolu, sw.replace('__SURUM__', surum));

const mb = (toplamBayt / 1048576).toFixed(1);
console.log(`Service worker sürümü ${surum} · ${yollar.length} dosya · ${mb} MB çevrimdışı içerik`);

// Çevrimdışı paket sessizce şişerse fark edelim.
if (toplamBayt > 25 * 1048576) {
  console.warn('UYARI: çevrimdışı paket 25 MB üstünde. Kurulumda indirilen hacmi gözden geçir.');
}
