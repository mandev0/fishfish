/**
 * Ay evresi — tamamen lokal hesap, API gerektirmez.
 * Referans yeni ay: 6 Ocak 2000, 18:14 UTC. Sinodik ay: 29.530588853 gün.
 */

const REFERANS_YENI_AY = Date.UTC(2000, 0, 6, 18, 14, 0);
const SINODIK_AY = 29.530588853;
const GUN_MS = 86_400_000;

export type AyEvresiId =
  | 'yeni' | 'hilal-buyuyen' | 'ilk-dordun' | 'siskin-buyuyen'
  | 'dolunay' | 'siskin-kuculen' | 'son-dordun' | 'hilal-kuculen';

export interface AyEvresi {
  id: AyEvresiId;
  ad: string;
  simge: string;
  /** 0 = yeni ay, 0.5 = dolunay, 1'e doğru tekrar yeni ay. */
  faz: number;
  /** Aydınlanma oranı 0-1. */
  aydinlanma: number;
  /** Yeni ay veya dolunaya olan uzaklık (gün). Balıkçılıkta bu iki uç makbul sayılır. */
  ucaUzaklikGun: number;
}

const EVRELER: { id: AyEvresiId; ad: string; simge: string }[] = [
  { id: 'yeni', ad: 'Yeni ay', simge: '🌑' },
  { id: 'hilal-buyuyen', ad: 'Büyüyen hilal', simge: '🌒' },
  { id: 'ilk-dordun', ad: 'İlk dördün', simge: '🌓' },
  { id: 'siskin-buyuyen', ad: 'Büyüyen şişkin ay', simge: '🌔' },
  { id: 'dolunay', ad: 'Dolunay', simge: '🌕' },
  { id: 'siskin-kuculen', ad: 'Küçülen şişkin ay', simge: '🌖' },
  { id: 'son-dordun', ad: 'Son dördün', simge: '🌗' },
  { id: 'hilal-kuculen', ad: 'Küçülen hilal', simge: '🌘' },
];

export function ayEvresi(tarih: Date = new Date()): AyEvresi {
  const gecenGun = (tarih.getTime() - REFERANS_YENI_AY) / GUN_MS;
  const faz = ((gecenGun / SINODIK_AY) % 1 + 1) % 1;

  // 8 evre, her biri 1/8'lik dilim; sınırlar dilim ortasına denk gelsin diye kaydırıyoruz.
  const indeks = Math.floor(((faz + 1 / 16) % 1) * 8) % 8;
  const evre = EVRELER[indeks]!;

  const aydinlanma = (1 - Math.cos(2 * Math.PI * faz)) / 2;
  const yeniAyaUzaklik = Math.min(faz, 1 - faz) * SINODIK_AY;
  const dolunayaUzaklik = Math.abs(faz - 0.5) * SINODIK_AY;

  return {
    id: evre.id,
    ad: evre.ad,
    simge: evre.simge,
    faz,
    aydinlanma,
    ucaUzaklikGun: Math.min(yeniAyaUzaklik, dolunayaUzaklik),
  };
}
