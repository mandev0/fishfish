#!/usr/bin/env node
/**
 * İstanbul'daki olta/balıkçı malzemesi dükkânlarını OpenStreetMap'ten çeker.
 *
 * Build sırasında değil, elle çalıştırılır: `npm run veri:dukkanlar`
 * Sonuç src/data/shops.json'a yazılır ve sürüm kontrolüne girer.
 * Böylece site derlemesi ağa bağımlı olmaz.
 *
 * Veri: OpenStreetMap katkıcıları, ODbL lisansı.
 */

import { writeFileSync } from 'node:fs';

// Kapsanan iller: İstanbul ve Kocaeli.
const SORGU = `[out:json][timeout:90];
(
  area["name"="İstanbul"]["admin_level"="4"];
  area["name"="Kocaeli"]["admin_level"="4"];
  area["name"="Sakarya"]["admin_level"="4"];
)->.iller;
(
  node["shop"="fishing"](area.iller);
  way["shop"="fishing"](area.iller);
  node["shop"="outdoor"]["fishing"="yes"](area.iller);
);
out center 400;`;

const SUNUCULAR = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function sorgula() {
  let sonHata;
  for (const sunucu of SUNUCULAR) {
    try {
      // Overpass, sorguyu form gövdesinde `data` alanında bekler;
      // düz metin gönderilirse 406 döner.
      const y = await fetch(sunucu, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Overpass, kendini tanıtmayan istemcilere 406 döndürüyor.
          'User-Agent': 'fishfish/0.1 (kisisel balikcilik rehberi)',
          Accept: 'application/json',
        },
        body: new URLSearchParams({ data: SORGU }),
      });
      if (!y.ok) throw new Error(`${sunucu} → HTTP ${y.status}`);
      return await y.json();
    } catch (e) {
      sonHata = e;
      console.warn(`  ${e.message}, sıradaki sunucu deneniyor…`);
    }
  }
  throw sonHata;
}

const veri = await sorgula();

const dukkanlar = (veri.elements ?? [])
  .map((e) => {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return {
      id: `osm-${e.type}-${e.id}`,
      ad: t.name ?? 'İsimsiz olta dükkânı',
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      ilce: t['addr:district'] ?? t['addr:city'] ?? t['addr:suburb'] ?? null,
      il: t['addr:province'] ?? null,
      adres: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') || null,
      telefon: t.phone ?? t['contact:phone'] ?? null,
      site: t.website ?? t['contact:website'] ?? null,
      saatler: t.opening_hours ?? null,
      osm: `https://www.openstreetmap.org/${e.type}/${e.id}`,
    };
  })
  .filter(Boolean)
  // Aynı çarşıdaki dükkânlar birbirine çok yakın; hepsini tutuyoruz ama sıralı olsun.
  .sort((a, b) => (a.ilce ?? '').localeCompare(b.ilce ?? '', 'tr') || a.ad.localeCompare(b.ad, 'tr'));

const cikti = {
  kaynak: 'OpenStreetMap (Overpass API) — © OpenStreetMap katkıcıları, ODbL',
  cekilmeTarihi: new Date().toISOString().slice(0, 10),
  dukkanlar,
};

writeFileSync(new URL('../src/data/shops.json', import.meta.url), JSON.stringify(cikti, null, 2) + '\n');
console.log(`${dukkanlar.length} dükkân yazıldı → src/data/shops.json`);
const isimli = dukkanlar.filter((d) => d.ad !== 'İsimsiz olta dükkânı').length;
console.log(`  isimli: ${isimli} · ilçe bilgisi olan: ${dukkanlar.filter((d) => d.ilce).length}`);
