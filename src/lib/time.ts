/**
 * Zaman yardımcıları.
 *
 * Site İstanbul'a özel ama tarayıcının saat dilimi başka olabilir
 * (VPN, seyahat, sunucu build'i). Bu yüzden "saat kaç" sorusunu
 * her zaman Europe/Istanbul üzerinden yanıtlıyoruz.
 */

export const ISTANBUL = 'Europe/Istanbul';

const PARCA_FORMATI = new Intl.DateTimeFormat('tr-TR', {
  timeZone: ISTANBUL,
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric',
  hour12: false,
});

export interface ZamanParcalari {
  yil: number; ay: number; gun: number; saat: number; dakika: number;
}

export function istanbulParcalari(tarih: Date = new Date()): ZamanParcalari {
  const p: Record<string, string> = {};
  for (const { type, value } of PARCA_FORMATI.formatToParts(tarih)) {
    if (type !== 'literal') p[type] = value;
  }
  return {
    yil: Number(p.year),
    ay: Number(p.month),
    gun: Number(p.day),
    // Bazı ortamlarda gece yarısı "24" olarak gelir.
    saat: Number(p.hour) % 24,
    dakika: Number(p.minute),
  };
}

export const istanbulSaat = (t: Date = new Date()) => istanbulParcalari(t).saat;
export const istanbulAy = (t: Date = new Date()) => istanbulParcalari(t).ay;

const SAAT_FORMATI = new Intl.DateTimeFormat('tr-TR', {
  timeZone: ISTANBUL, hour: '2-digit', minute: '2-digit', hour12: false,
});
const GUN_FORMATI = new Intl.DateTimeFormat('tr-TR', {
  timeZone: ISTANBUL, weekday: 'short', day: 'numeric', month: 'long',
});

export const saatMetni = (t: Date) => SAAT_FORMATI.format(t);
export const gunMetni = (t: Date) => GUN_FORMATI.format(t);

/** utc_offset_seconds → "+03:00" biçimi. */
export function ofsetMetni(saniye: number): string {
  const isaret = saniye < 0 ? '-' : '+';
  const mutlak = Math.abs(saniye);
  const sa = String(Math.floor(mutlak / 3600)).padStart(2, '0');
  const dk = String(Math.floor((mutlak % 3600) / 60)).padStart(2, '0');
  return `${isaret}${sa}:${dk}`;
}

/**
 * Open-Meteo yerel ISO damgasını ("2026-08-28T14:00") mutlak Date'e çevirir.
 * Ofseti API'nin bildirdiği `utc_offset_seconds` üzerinden ekleriz; böylece
 * tarayıcının saat dilimi ne olursa olsun aynı ana işaret ederiz.
 */
export function isoyuCozumle(iso: string, ofsetSaniye: number): Date {
  const tam = iso.length === 16 ? `${iso}:00` : iso;
  return new Date(`${tam}${ofsetMetni(ofsetSaniye)}`);
}

/**
 * "Ne kadar önce" metni — ağ düşünce gösterilen son verinin yaşını söylemek için.
 * Kullanıcı bayat bir tahmine bakıyorsa bunu gizlemiyoruz.
 */
export function gecenSureMetni(ms: number): string {
  const dakika = Math.floor(ms / 60000);
  if (dakika < 1) return 'az önce';
  if (dakika < 60) return `${dakika} dakika önce`;
  const saat = Math.floor(dakika / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  return `${gun} gün önce`;
}
