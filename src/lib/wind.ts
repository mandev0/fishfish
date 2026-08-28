/**
 * Rüzgâr yardımcıları.
 *
 * Meteorolojik konvansiyon: `derece` rüzgârın GELDİĞİ yönü gösterir
 * (Open-Meteo `wind_direction_10m` da böyle döner).
 */

export type RuzgarAdi =
  | 'yildiz' | 'poyraz' | 'gundogusu' | 'kesisleme'
  | 'kible' | 'lodos' | 'gunbatisi' | 'karayel';

export interface RuzgarBilgisi {
  id: RuzgarAdi;
  ad: string;
  yon: string;
  aciklama: string;
}

/** Türk rüzgâr gülü — 8 ana yön, her biri 45°'lik dilim. */
export const RUZGARLAR: Record<RuzgarAdi, RuzgarBilgisi> = {
  yildiz: { id: 'yildiz', ad: 'Yıldız', yon: 'K', aciklama: 'Kuzeyden. Serin ve genelde berrak su getirir.' },
  poyraz: { id: 'poyraz', ad: 'Poyraz', yon: 'KD', aciklama: 'Kuzeydoğudan. Boğaz akıntısını hızlandırır; lüfer ve palamut için klasik "iyi hava".' },
  gundogusu: { id: 'gundogusu', ad: 'Gündoğusu', yon: 'D', aciklama: 'Doğudan. İstanbul kıyılarında nispeten seyrek.' },
  kesisleme: { id: 'kesisleme', ad: 'Keşişleme', yon: 'GD', aciklama: 'Güneydoğudan. Ilık ve nemli; Marmara kıyısında dalga yapar.' },
  kible: { id: 'kible', ad: 'Kıble', yon: 'G', aciklama: 'Güneyden. Marmara kıyılarına doğrudan dalga bindirir.' },
  lodos: { id: 'lodos', ad: 'Lodos', yon: 'GB', aciklama: 'Güneybatıdan. Suyu bulandırır, Marmara kıyısını dövüp Boğaz’da orkoz (ters akıntı) yaratır.' },
  gunbatisi: { id: 'gunbatisi', ad: 'Günbatısı', yon: 'B', aciklama: 'Batıdan. Lodosun daha yumuşak akrabası.' },
  karayel: { id: 'karayel', ad: 'Karayel', yon: 'KB', aciklama: 'Kuzeybatıdan. Sert ve soğuk; Karadeniz kıyısını en çok dövüşü.' },
};

const SIRA: RuzgarAdi[] = [
  'yildiz', 'poyraz', 'gundogusu', 'kesisleme',
  'kible', 'lodos', 'gunbatisi', 'karayel',
];

export function normalizeDerece(derece: number): number {
  return ((derece % 360) + 360) % 360;
}

/** Dereceyi Türkçe rüzgâr adına çevirir. 0°=yıldız, 45°=poyraz, 225°=lodos, 315°=karayel. */
export function ruzgarAdi(derece: number): RuzgarAdi {
  const d = normalizeDerece(derece);
  const dilim = Math.round(d / 45) % 8;
  return SIRA[dilim]!;
}

export function ruzgar(derece: number): RuzgarBilgisi {
  return RUZGARLAR[ruzgarAdi(derece)];
}

/** Beaufort ölçeği alt sınırları (km/sa). */
const BEAUFORT_ESIK = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];

const BEAUFORT_AD = [
  'Durgun', 'Esinti', 'Hafif rüzgâr', 'Tatlı rüzgâr', 'Orta rüzgâr',
  'Sert rüzgâr', 'Kuvvetli rüzgâr', 'Fırtınamsı rüzgâr', 'Fırtına',
  'Kuvvetli fırtına', 'Tam fırtına', 'Çok şiddetli fırtına', 'Orkan',
];

export function beaufort(kmh: number): number {
  let bf = 0;
  for (const esik of BEAUFORT_ESIK) {
    if (kmh >= esik) bf++;
    else break;
  }
  return bf;
}

export function beaufortAdi(kmh: number): string {
  return BEAUFORT_AD[beaufort(kmh)] ?? 'Orkan';
}

export type KiyiIliskisi = 'denizden' | 'karadan' | 'yandan';

/**
 * Rüzgârın kıyıya göre konumu.
 * @param ruzgarDerece rüzgârın geldiği yön
 * @param kiyiYonu kıyının denize baktığı yön (karadan denize doğru)
 *
 * Rüzgâr kıyının baktığı yönden geliyorsa denizden kıyıya eser (onshore).
 */
export function kiyiIliskisi(ruzgarDerece: number, kiyiYonu: number): KiyiIliskisi {
  const fark = Math.abs(((normalizeDerece(ruzgarDerece) - normalizeDerece(kiyiYonu) + 180) % 360) - 180);
  if (fark <= 60) return 'denizden';
  if (fark >= 120) return 'karadan';
  return 'yandan';
}

export const KIYI_ILISKISI_METNI: Record<KiyiIliskisi, string> = {
  denizden: 'Rüzgâr denizden kıyıya esiyor — yem kıyıya yaklaşır ama atış zorlaşır, dalga büyür.',
  karadan: 'Rüzgâr karadan denize esiyor — su düz, atış mesafesi uzar, misina kontrolü kolay.',
  yandan: 'Rüzgâr kıyıya paralel esiyor — misina yan sürüklenir, ağırlığı biraz artırmak gerekebilir.',
};
