/**
 * Metin içindeki balıkçılık terimlerini otomatik işaretleme.
 *
 * Sözlük maddeleri ve ekipman kayıtları tek bir dizinde toplanır; metinde
 * geçtiklerinde tıklanabilir/üzerine gelinebilir bir işaretle sarılır.
 * İşaretleme derleme zamanında yapılır — tarayıcıya hazır HTML gider,
 * istemci tarafı yalnızca balonu açıp kapatır.
 */

import gear from '../data/gear.json';
import sozluk from '../data/glossary.json';

export interface TerimKaydi {
  id: string;
  ad: string;
  ozet: string;
  /** Ekipman kayıtlarının ayrıntı sayfası var; sözlük maddelerinin yok. */
  href?: string;
  kaynak: 'ekipman' | 'sozluk';
}

/** Türkçe "İ" küçültülünce araya birleşen nokta (U+0307) giriyor; onu temizliyoruz. */
export function kucult(s: string): string {
  return s.normalize('NFC').toLocaleLowerCase('tr').replace(/̇/g, '');
}

function kayitlariTopla(): { kayitlar: Map<string, TerimKaydi>; yuzeyler: Map<string, string> } {
  const kayitlar = new Map<string, TerimKaydi>();
  const yuzeyler = new Map<string, string>();   // aranacak metin → terim kimliği

  const ekle = (kayit: TerimKaydi, adaylar: string[]) => {
    kayitlar.set(kayit.id, kayit);
    for (const a of adaylar) {
      const k = kucult(a.trim());
      // Çok kısa terimler metinde gürültü yaratıyor.
      if (k.length < 4) continue;
      if (!yuzeyler.has(k)) yuzeyler.set(k, kayit.id);
    }
  };

  for (const e of gear) {
    ekle(
      { id: `ekipman:${e.id}`, ad: e.ad, ozet: e.ozet, href: `/ekipman/${e.id}`, kaynak: 'ekipman' },
      [e.kisaAd, e.ad, ...e.esAdlar],
    );
  }
  for (const s of sozluk) {
    // Ekipman kaydı olan bir terimi sözlük tekrar ezmesin; ekipman sayfası daha zengin.
    const anahtar = kucult(s.terim);
    if (yuzeyler.has(anahtar)) continue;
    ekle(
      { id: `sozluk:${anahtar}`, ad: s.terim, ozet: s.aciklama, kaynak: 'sozluk' },
      [s.terim],
    );
  }
  return { kayitlar, yuzeyler };
}

const { kayitlar: KAYITLAR, yuzeyler: YUZEYLER } = kayitlariTopla();

export const terimKaydi = (id: string): TerimKaydi | undefined => KAYITLAR.get(id);

/** Sayfaya gömülecek balon içerikleri. */
export function terimSozlugu(): Record<string, TerimKaydi> {
  return Object.fromEntries(KAYITLAR);
}

const KACIS: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const kacir = (s: string) => s.replace(/[&<>"']/g, (c) => KACIS[c]!);

/**
 * Türkçe ek almış hâlleri de yakalayabilmek için terimden sonra en fazla
 * dört küçük harfe izin veriyoruz: "misinayı", "zokayla", "çapariden" gibi.
 * Terimin başında ve ekin sonunda harf/rakam olmamalı.
 */
const DESEN = (() => {
  const yuzeyler = [...YUZEYLER.keys()].sort((a, b) => b.length - a.length);
  const kacisli = yuzeyler.map((y) => y.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(${kacisli.join('|')})([a-zçğıöşü]{0,4})(?![\\p{L}\\p{N}])`,
    'giu',
  );
})();

export interface IsaretleSecenekleri {
  /** Aynı terimi sayfada bir kereden fazla işaretlememek için paylaşılan küme. */
  gorulen?: Set<string>;
  /** Kendi sayfasındayken terimi kendine bağlamamak için. */
  haric?: string;
}

/**
 * Düz metni, terimleri işaretlenmiş güvenli HTML'e çevirir.
 * Girdi önce kaçırılır; HTML enjeksiyonu mümkün değildir.
 */
export function isaretle(metin: string, secenekler: IsaretleSecenekleri = {}): string {
  const { gorulen, haric } = secenekler;
  const desen = new RegExp(DESEN.source, DESEN.flags);

  return metin.replace(desen, (tam, govde: string, ek: string) => {
    const id = YUZEYLER.get(kucult(govde));
    if (!id) return kacir(tam);
    if (haric && id === haric) return kacir(tam);
    if (gorulen) {
      if (gorulen.has(id)) return kacir(tam);
      gorulen.add(id);
    }
    return `<button type="button" class="terim" data-terim="${kacir(id)}">${kacir(govde + ek)}</button>`;
  });
}
