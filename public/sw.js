/**
 * Service worker — çevrimdışı kullanım.
 *
 * Site tamamen statik ve tüm çıktı sıkıştırılmış ~2 MB, bu yüzden kurulumda
 * her sayfayı önbelleğe alıyoruz: kıyıda şebeke yokken rehberin tamamı açılır.
 *
 * Neyi önbelleğe almadığımız da bilinçli:
 *   - Open-Meteo istekleri **ağdan** geçer. Hava verisinin tazeliği kritik ve
 *     `openMeteo.ts` içinde zaman damgalı bir localStorage katmanı zaten var;
 *     buraya ikinci bir önbellek koyarsak veri yaşı iki yerden yönetilir.
 *   - Harita karoları ağdan geçer. Çevrimdışı harita kapsam dışı bırakıldı;
 *     karo gelmezse harita gizlenir, liste ve filtreler çalışmaya devam eder.
 *
 * `SURUM` derlemeden sonra `scripts/sw-surum.mjs` tarafından yazılır. Değeri
 * çıktının içerik özetidir: çıktı değişmezse tarayıcı gereksiz yere güncellemez.
 */

const SURUM = '__SURUM__';
const ONBELLEK = `fishfish-${SURUM}`;
const LISTE_URL = '/sw-liste.json';
const CEVRIMDISI = '/cevrimdisi';

/** Bunlar olmadan uygulama açılmaz. */
const CEKIRDEK = ['/', CEVRIMDISI, '/manifest.webmanifest'];

/** Aynı anda kaç istek? 158 sayfayı tek seferde istemek bağlantıyı boğuyor. */
const KUME = 12;

/**
 * Önbellek anahtarı. Sorgu dizesi ve çapa atılır, sondaki eğik çizgi
 * normalleştirilir: site içindeki bağlantılar `/noktalar` derken statik çıktı
 * `/noktalar/index.html` — ikisi aynı kayda düşmezse çevrimdışında sayfa
 * bulunamaz.
 */
function anahtarla(url) {
  const u = new URL(url, self.location.origin);
  u.hash = '';
  u.search = '';
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.slice(0, -1);
  }
  return u.href;
}

async function indirVeKoy(onbellek, yol) {
  const yanit = await fetch(new Request(yol, { cache: 'reload' }));
  if (!yanit.ok) throw new Error(`${yol} → ${yanit.status}`);
  await onbellek.put(anahtarla(yol), yanit);
}

async function kumeliEkle(onbellek, yollar) {
  for (let i = 0; i < yollar.length; i += KUME) {
    // Tek tek ekliyoruz: `addAll` bir istek düşerse tümünü iptal ediyor,
    // oysa 157 sayfası duran bir önbellek 0 sayfalıktan iyidir.
    await Promise.allSettled(yollar.slice(i, i + KUME).map((y) => indirVeKoy(onbellek, y)));
  }
}

self.addEventListener('install', (olay) => {
  olay.waitUntil((async () => {
    const onbellek = await caches.open(ONBELLEK);
    for (const yol of CEKIRDEK) await indirVeKoy(onbellek, yol);

    let liste = [];
    try {
      const yanit = await fetch(LISTE_URL, { cache: 'no-store' });
      if (yanit.ok) liste = (await yanit.json()).dosyalar ?? [];
    } catch {
      // Liste alınamazsa çekirdek kadarıyla kurulur; sonraki ziyarette tamamlanır.
    }
    await kumeliEkle(onbellek, liste.filter((y) => !CEKIRDEK.includes(y)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (olay) => {
  olay.waitUntil((async () => {
    for (const ad of await caches.keys()) {
      if (ad.startsWith('fishfish-') && ad !== ONBELLEK) await caches.delete(ad);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (olay) => {
  const istek = olay.request;
  if (istek.method !== 'GET') return;

  const url = new URL(istek.url);
  // Başka kaynaklar (Open-Meteo, harita karoları) doğrudan ağa gider.
  if (url.origin !== self.location.origin) return;
  // Bu ikisi hep taze okunmalı, yoksa güncelleme kendi kendini kilitler.
  if (url.pathname === '/sw.js' || url.pathname === LISTE_URL) return;

  olay.respondWith((async () => {
    const onbellek = await caches.open(ONBELLEK);
    // Önbellek önce: her şey kurulumda indirildi, ağ beklemeden açılır.
    const kayitli = await onbellek.match(anahtarla(istek.url));
    if (kayitli) return kayitli;

    try {
      const yanit = await fetch(istek);
      // Kurulumdan sonra eklenen bir yol (geç yüklenen varlık) olabilir.
      if (yanit.ok && yanit.type === 'basic') {
        await onbellek.put(anahtarla(istek.url), yanit.clone());
      }
      return yanit;
    } catch {
      if (istek.mode === 'navigate') {
        const yedek = await onbellek.match(anahtarla(CEVRIMDISI));
        if (yedek) return yedek;
      }
      return new Response('Çevrimdışısın ve bu içerik önbellekte yok.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
