/**
 * Skor motorunun bütün ayarları burada. Tek bir sayı değiştirerek
 * tüm sitedeki tavsiyeleri kalibre edebilirsin.
 *
 * NOT: Bu değerler balıkçılık pratiğinden ve yaygın kabullerden türetilmiş
 * SEZGİSEL ağırlıklardır; bilimsel bir model değildir.
 */

export const AGIRLIKLAR = {
  suSicakligi: 1.4,
  ruzgarSiddeti: 1.2,
  ruzgarYonu: 0.8,
  dalga: 1.0,
  basinc: 0.7,
  saat: 1.3,
  ayEvresi: 0.5,
  hava: 0.5,
} as const;

/** Mevsim dışı bir tür, hava ne kadar iyi olursa olsun yükselmesin. */
export const MEVSIM_USSU = 0.6;

/** Koşullar berbat olsa bile sezon zirvesindeyken kalan taban pay. */
export const KOSUL_TABANI = 0.35;

/** Rüzgâr hızı (km/sa) → puan. Aradaki değerler doğrusal yorumlanır. */
export const RUZGAR_EGRISI: [number, number][] = [
  [0, 0.70],   // cam gibi deniz: su fazla berrak, avcı balık ürkek
  [8, 0.95],
  [15, 1.00],  // kıyı balıkçılığı için ideal bant
  [22, 0.85],
  [30, 0.55],
  [40, 0.28],
  [50, 0.10],
  [70, 0.02],
];

/** Dalga yüksekliği (m) → puan. */
export const DALGA_EGRISI: [number, number][] = [
  [0.00, 0.70],
  [0.20, 1.00],
  [0.50, 0.95],
  [0.80, 0.70],
  [1.10, 0.40],
  [1.50, 0.12],
  [2.50, 0.02],
];

/** 6 saatlik basınç değişimi (hPa) → puan. */
export const BASINC_EGRISI: [number, number][] = [
  [-6, 0.80],  // hızlı düşüş: ısırık artar ama hava bozuyor
  [-3, 1.00],
  [-1, 0.95],
  [0, 0.75],
  [1, 0.65],
  [3, 0.50],
  [6, 0.40],
];

/** Güvenlik eşikleri — aşılırsa skor ne olursa olsun uyarı basılır. */
export const TEHLIKE = {
  dalgaM: 1.2,
  ruzgarKmh: 45,
  hamleKmh: 60,
} as const;

export const SEVIYE_ESIKLERI = {
  cokIyi: 72,
  iyi: 55,
  orta: 32,
} as const;

export const SEVIYE_METNI = {
  cokIyi: 'Çok İyi',
  iyi: 'İyi',
  orta: 'Orta',
  dusuk: 'Zayıf',
} as const;
