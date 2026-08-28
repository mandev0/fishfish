#!/usr/bin/env node
/**
 * Veri bütünlüğü denetimi.
 *
 * Astro'nun zod şeması alan tiplerini build sırasında zaten doğruluyor.
 * Bu script onun göremediğini kontrol eder: dosyalar arası kimlik (id)
 * referansları gerçekten var mı, koordinatlar İstanbul'da mı,
 * yasal kayıtların kaynağı belirtilmiş mi.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KOK = new URL('..', import.meta.url).pathname;
const oku = (p) => JSON.parse(readFileSync(join(KOK, p), 'utf8'));

const hatalar = [];
const uyarilar = [];
const hata = (m) => hatalar.push(m);
const uyari = (m) => uyarilar.push(m);

const spots = oku('src/data/spots.json');
const methods = oku('src/data/methods.json');
const rigs = oku('src/data/rigs.json');
const knots = oku('src/data/knots.json');
const gear = oku('src/data/gear.json');
const sozluk = oku('src/data/glossary.json');
const shops = oku('src/data/shops.json');

const ikonKaynak = readFileSync(join(KOK, 'src/lib/ikonlar.ts'), 'utf8');
const ikonlar = new Set(
  [...ikonKaynak.matchAll(/^\s{2}'?([\w-]+)'?:\s*'</gm)].map((m) => m[1]),
);

const turDosyalari = readdirSync(join(KOK, 'src/data/species')).filter((f) => f.endsWith('.json'));
const species = turDosyalari.map((f) => ({
  id: f.replace(/\.json$/, ''),
  ...oku(join('src/data/species', f)),
}));

const turId = new Set(species.map((t) => t.id));
const noktaId = new Set(spots.map((s) => s.id));
const takimId = new Set(rigs.map((r) => r.id));
const yontemId = new Set(methods.map((m) => m.id));
const dugumId = new Set(knots.map((k) => k.id));
const ekipmanId = new Set(gear.map((g) => g.id));

// --- Benzersizlik ---------------------------------------------------
for (const [ad, liste] of [['nokta', spots], ['takım', rigs], ['düğüm', knots], ['ekipman', gear], ['yöntem', methods]]) {
  const gorulen = new Set();
  for (const kayit of liste) {
    if (gorulen.has(kayit.id)) hata(`Yinelenen ${ad} id: ${kayit.id}`);
    gorulen.add(kayit.id);
  }
}

// --- Türler ---------------------------------------------------------
/**
 * Kapsanan alan: İstanbul + Kocaeli + Sakarya (Sapanca Gölü ve Adapazarı iç suları dahil).
 * content.config.ts içindeki koordinat sınırlarıyla aynı olmalı.
 */
const KAPSAM_BBOX = { latMin: 40.6, latMax: 41.45, lngMin: 27.9, lngMax: 30.62 };

/**
 * Bölge → il eşlemesi tek kaynaktan okunur: season.ts. Burada kopyasını tutmak
 * iki dosyanın sessizce ayrışmasına yol açıyordu.
 */
const seasonKaynak = readFileSync(join(KOK, 'src/lib/season.ts'), 'utf8');
const bolgeIliBloku = seasonKaynak.match(/BOLGE_ILI: Record<string, string> = \{([^}]*)\}/s);
const BOLGE_ILI = Object.fromEntries(
  [...(bolgeIliBloku?.[1] ?? '').matchAll(/'([\w-]+)':\s*'([\w-]+)'/g)].map((m) => [m[1], m[2]]),
);
if (!Object.keys(BOLGE_ILI).length) hata('season.ts içindeki BOLGE_ILI eşlemesi okunamadı.');

/** Su alanının tuzluluk sınıfı — yine season.ts'ten. */
const suTuruBloku = seasonKaynak.match(/SU_TURU: Record<string, 'deniz' \| 'tatli' \| 'aci'> = \{([^}]*)\}/s);
const SU_TURU = Object.fromEntries(
  [...(suTuruBloku?.[1] ?? '').matchAll(/(\w+):\s*'(\w+)'/g)].map((m) => [m[1], m[2]]),
);
if (!Object.keys(SU_TURU).length) hata('season.ts içindeki SU_TURU eşlemesi okunamadı.');

for (const t of species) {
  const nerede = `species/${t.id}.json`;

  if (!Array.isArray(t.aylar) || t.aylar.length !== 12) {
    hata(`${nerede}: aylar dizisi 12 elemanlı olmalı (şu an ${t.aylar?.length}).`);
  } else if (t.aylar.every((a) => a === 0)) {
    hata(`${nerede}: hiçbir ayda bulunmuyor — veri eksik olmalı.`);
  }

  for (const r of t.takimlar ?? []) {
    if (!takimId.has(r)) hata(`${nerede}: bilinmeyen takım "${r}".`);
  }
  for (const n of t.noktalar ?? []) {
    if (!noktaId.has(n)) hata(`${nerede}: bilinmeyen nokta "${n}".`);
  }
  if (!t.noktalar?.length) hata(`${nerede}: hiçbir noktaya bağlı değil.`);

  for (const k of t.teshis?.karistirilan ?? []) {
    if (!turId.has(k)) hata(`${nerede}: "karistirilan" içinde bilinmeyen tür "${k}".`);
  }

  if (!t.yasal?.kaynak) hata(`${nerede}: yasal.kaynak boş.`);
  // İç su türlerinde üreme yasağı dönemi yazılmalı; kıyı türlerinde böyle bir dönem yok.
  if ((t.sular ?? []).every((s) => s === 'gol' || s === 'dere') && !t.yasal?.yasakDonemi) {
    hata(`${nerede}: iç su türü; yasal.yasakDonemi yazılmalı.`);
  }
  if (!t.yasal?.kontrolTarihi) hata(`${nerede}: yasal.kontrolTarihi boş.`);
  if (t.yasal?.asgariBoy === undefined) hata(`${nerede}: yasal.asgariBoy alanı yok (bilinmiyorsa null yaz).`);
  if (t.yasal?.asgariBoy === null && !t.yasal?.not) {
    uyari(`${nerede}: asgari boy null ama açıklayıcı not yok.`);
  }

  const { min, ideal, max } = t.suSicakligi ?? {};
  if (!(min <= ideal?.[0] && ideal[0] <= ideal[1] && ideal[1] <= max)) {
    hata(`${nerede}: su sıcaklığı aralığı tutarsız (min ≤ ideal[0] ≤ ideal[1] ≤ max olmalı).`);
  }

  // Karşılıklı tutarlılık: türün listelediği nokta, o türü listeliyor mu?
  for (const n of t.noktalar ?? []) {
    const nokta = spots.find((s) => s.id === n);
    if (nokta && !nokta.turler.includes(t.id)) {
      hata(`${nerede}: "${n}" noktasını listeliyor ama nokta bu türü listelemiyor.`);
    }
  }
}

// --- Noktalar -------------------------------------------------------
for (const s of spots) {
  const nerede = `spots.json → ${s.id}`;
  for (const t of s.turler ?? []) {
    if (!turId.has(t)) { hata(`${nerede}: bilinmeyen tür "${t}".`); continue; }
    // Ters yön: nokta bir türü listeliyorsa, o tür de bu noktayı listelemeli.
    // Bu kontrol olmadan tek yönlü eklemeler sessizce yarım kalıyor.
    const tur = species.find((x) => x.id === t);
    if (tur && !tur.noktalar.includes(s.id)) {
      hata(`${nerede}: "${t}" türünü listeliyor ama tür bu noktayı listelemiyor.`);
    }
  }
  if (!s.turler?.length) hata(`${nerede}: hiçbir tür listelenmemiş.`);
  if (s.lat < KAPSAM_BBOX.latMin || s.lat > KAPSAM_BBOX.latMax
    || s.lng < KAPSAM_BBOX.lngMin || s.lng > KAPSAM_BBOX.lngMax) {
    hata(`${nerede}: koordinat kapsanan alanın dışında (${s.lat}, ${s.lng}).`);
  }
  if (s.kiyiYonu < 0 || s.kiyiYonu > 359) hata(`${nerede}: kiyiYonu 0-359 arası olmalı.`);
  // İl ile bölge birbirini tutmalı; bağımlı seçim kutuları buna güveniyor.
  const bolgeIli = BOLGE_ILI[s.bolge];
  if (!bolgeIli) hata(`${nerede}: bölge "${s.bolge}" season.ts içindeki BOLGE_ILI eşlemesinde yok.`);
  else if (s.il !== bolgeIli) {
    hata(`${nerede}: il "${s.il}" ile bölge "${s.bolge}" uyuşmuyor (beklenen il: ${bolgeIli}).`);
  }

  if (!SU_TURU[s.su]) hata(`${nerede}: su alanı "${s.su}" season.ts içindeki SU_TURU eşlemesinde yok.`);

  // Yöntemler: kimlik gerçek mi ve bu suda uygulanabilir mi?
  if (!s.yontemler?.length) hata(`${nerede}: hiçbir yöntem listelenmemiş.`);
  const suSinifi = SU_TURU[s.su] === 'deniz' ? 'deniz' : 'tatli';
  for (const y of s.yontemler ?? []) {
    const yontem = methods.find((m) => m.id === y);
    if (!yontem) { hata(`${nerede}: bilinmeyen yöntem "${y}".`); continue; }
    if (!yontem.sular.includes(suSinifi)) {
      hata(`${nerede}: "${y}" yöntemi ${suSinifi} suda uygulanmıyor (yöntemin suları: ${yontem.sular.join(', ')}).`);
    }
  }

  // Tatlı ve acı sularda deniz modeli yok; bu açıkça işaretlenmeli.
  if (SU_TURU[s.su] !== 'deniz' && !s.denizVerisiZayif) {
    hata(`${nerede}: tatlı/acı su noktası "denizVerisiZayif: true" ile işaretlenmeli.`);
  }

  if (s.mevzuat && (!s.mevzuat.kaynak || !s.mevzuat.kontrolTarihi)) {
    hata(`${nerede}: mevzuat notunun kaynağı veya kontrol tarihi eksik.`);
  }
  if (SU_TURU[s.su] !== 'deniz' && !s.mevzuat) {
    uyari(`${nerede}: iç su noktası; av yasağı dönemi için mevzuat notu yazılmalı.`);
  }
}

// --- Yöntemler ------------------------------------------------------
for (const m of methods) {
  const nerede = `methods.json → ${m.id}`;
  for (const t of m.takimlar ?? []) {
    if (!takimId.has(t)) hata(`${nerede}: bilinmeyen takım "${t}".`);
  }
  for (const t of m.turler ?? []) {
    if (!turId.has(t)) hata(`${nerede}: bilinmeyen tür "${t}".`);
  }
  for (const e of m.ekipman ?? []) {
    if (!ekipmanId.has(e)) hata(`${nerede}: bilinmeyen ekipman "${e}".`);
  }
  if (!ikonlar.has(m.ikon)) hata(`${nerede}: ikonlar.ts içinde "${m.ikon}" simgesi yok.`);
  if (!spots.some((s) => s.yontemler?.includes(m.id))) {
    uyari(`${nerede}: hiçbir nokta bu yöntemi listelemiyor.`);
  }
}

// --- Takımlar -------------------------------------------------------
for (const r of rigs) {
  const nerede = `rigs.json → ${r.id}`;
  for (const t of r.turler ?? []) {
    if (!turId.has(t)) hata(`${nerede}: bilinmeyen tür "${t}".`);
  }
  for (const d of r.dugumler ?? []) {
    if (!dugumId.has(d)) hata(`${nerede}: bilinmeyen düğüm "${d}".`);
  }
  if (!r.sema) hata(`${nerede}: sema anahtarı yok.`);
  if (!yontemId.has(r.yontem)) hata(`${nerede}: bilinmeyen yöntem "${r.yontem}".`);
  for (const b of r.bilesenler ?? []) {
    if (b.ekipman && !ekipmanId.has(b.ekipman)) {
      hata(`${nerede}: "${b.ad}" bileşeni bilinmeyen ekipmana bağlı: "${b.ekipman}".`);
    }
    if (!b.ekipman) uyari(`${nerede}: "${b.ad}" bileşeni hiçbir ekipman sayfasına bağlı değil.`);
  }
}

// --- Ekipman -------------------------------------------------------
for (const g of gear) {
  const nerede = `gear.json → ${g.id}`;
  for (const r of g.ilgili ?? []) {
    if (!ekipmanId.has(r)) hata(`${nerede}: bilinmeyen ilgili ekipman "${r}".`);
  }
  for (const d of g.dugumler ?? []) {
    if (!dugumId.has(d)) hata(`${nerede}: bilinmeyen düğüm "${d}".`);
  }
  if (!g.kisaAd) hata(`${nerede}: kisaAd boş — metin taramasında yakalanamaz.`);
  // terimler.ts dört harften kısa yüzeyleri gürültü sayıp atlıyor; en az bir
  // yüzeyin bu eşiği geçmesi gerekiyor, yoksa terim metinde hiç işaretlenmez.
  const yuzeyler = [g.kisaAd, g.ad, ...(g.esAdlar ?? [])].filter(Boolean);
  if (!yuzeyler.some((y) => y.trim().length >= 4)) {
    hata(`${nerede}: hiçbir adı dört harfi geçmiyor; metinde asla işaretlenmez.`);
  }
}

// --- Şema lejantları ------------------------------------------------
const lejant = readFileSync(join(KOK, 'src/lib/semaEtiketleri.ts'), 'utf8');
for (const [, tur, id] of lejant.matchAll(/tur: '(ekipman|dugum)', id: '([\w-]+)'/g)) {
  const kume = tur === 'ekipman' ? ekipmanId : dugumId;
  if (!kume.has(id)) hata(`semaEtiketleri.ts: bilinmeyen ${tur} "${id}".`);
}
for (const r of rigs) {
  // Anahtar tırnaklı da yazılabiliyor: `  'tatli-samandira': [`
  if (!lejant.includes(`  ${r.sema}: [`) && !lejant.includes(`  '${r.sema}': [`)) {
    uyari(`semaEtiketleri.ts: "${r.sema}" şeması için lejant tanımlı değil.`);
  }
}

// --- Dükkânlar ------------------------------------------------------
for (const dk of shops.dukkanlar ?? []) {
  if (dk.lat < KAPSAM_BBOX.latMin || dk.lat > KAPSAM_BBOX.latMax
    || dk.lng < KAPSAM_BBOX.lngMin || dk.lng > KAPSAM_BBOX.lngMax) {
    uyari(`shops.json → ${dk.ad}: koordinat kapsanan alanın dışında.`);
  }
}
if (!shops.kaynak || !shops.cekilmeTarihi) hata('shops.json: kaynak veya çekilme tarihi eksik.');

// --- Erişilebilirlik: her takım ve düğüm en az bir yerden erişilebilir mi? ---
const yontemTakimlari = new Set(methods.flatMap((m) => m.takimlar ?? []));
for (const r of rigs) {
  if (!yontemTakimlari.has(r.id)) {
    uyari(`rigs.json → ${r.id}: hiçbir yöntem sayfası bu takımı listelemiyor.`);
  }
}

const kullanilanTakim = new Set(species.flatMap((t) => t.takimlar ?? []));
for (const r of rigs) {
  if (!kullanilanTakim.has(r.id)) uyari(`rigs.json → ${r.id}: hiçbir tür bu takımı kullanmıyor.`);
}
const kullanilanDugum = new Set(rigs.flatMap((r) => r.dugumler ?? []));
for (const k of knots) {
  if (!kullanilanDugum.has(k.id)) uyari(`knots.json → ${k.id}: hiçbir takım bu düğümü kullanmıyor.`);
}

// --- Rapor ----------------------------------------------------------
console.log(
  `Denetlenen: ${species.length} tür, ${spots.length} nokta, ${methods.length} yöntem, `
  + `${rigs.length} takım, ${knots.length} düğüm, ${gear.length} ekipman, `
  + `${sozluk.length} sözlük maddesi, ${shops.dukkanlar.length} dükkân.`,
);
for (const u of uyarilar) console.log(`  UYARI  ${u}`);
for (const h of hatalar) console.error(`  HATA   ${h}`);

if (hatalar.length) {
  console.error(`\n${hatalar.length} hata bulundu.`);
  process.exit(1);
}
console.log(uyarilar.length ? `\n${uyarilar.length} uyarı, hata yok.` : '\nHer şey tutarlı.');
