/**
 * Gezinme tek kaynaktan tanımlanır: telefondaki alt sekme çubuğu, geniş ekrandaki
 * üst menü ve /menu sayfası hep bu listeyi okur. Yeni bir sayfa eklerken
 * yalnızca burası güncellenir.
 */

export interface Baglanti {
  ad: string;
  href: string;
  ipucu: string;
  ikon: string;
}

export interface Bolum {
  ad: string;
  ogeler: Baglanti[];
}

/**
 * Bölümler. "Planla" başlığındakiler telefonda alt sekme çubuğuna çıkar;
 * kalan bölümler /menu sayfasında listelenir.
 */
export const BOLUMLER: Bolum[] = [
  {
    ad: 'Planla',
    ogeler: [
      { ad: 'Bugün', href: '/', ipucu: 'Canlı havaya göre tavsiye', ikon: 'gunes' },
      { ad: 'Noktalar', href: '/noktalar', ipucu: 'Kıyı ve tatlı su', ikon: 'konum' },
      { ad: 'Takvim', href: '/takvim', ipucu: 'Ay ay hangi balık', ikon: 'takvim' },
    ],
  },
  {
    ad: 'Öğren',
    ogeler: [
      { ad: 'Yöntemler', href: '/yontem', ipucu: 'LRF, spin, aç-çek, yemli', ikon: 'yontem' },
      { ad: 'Balıklar', href: '/balik', ipucu: 'Deniz ve tatlı su', ikon: 'balik' },
      { ad: 'Takımlar', href: '/takim', ipucu: 'Şema ve kurulum', ikon: 'takim' },
      { ad: 'Düğümler', href: '/dugum', ipucu: 'Adım adım bağlama', ikon: 'dugum' },
      { ad: 'Ekipman', href: '/ekipman', ipucu: 'Ne alınır, ne işe yarar', ikon: 'ekipman' },
      { ad: 'Sözlük', href: '/sozluk', ipucu: 'Terimler', ikon: 'sozluk' },
    ],
  },
  {
    ad: 'Dikkat',
    ogeler: [
      { ad: 'Kurallar', href: '/kurallar', ipucu: 'Boy limitleri ve yasaklar', ikon: 'yasak' },
      { ad: 'Güvenlik', href: '/guvenlik', ipucu: 'Kayalık, hava, ekipman', ikon: 'uyari' },
    ],
  },
];

/** Geniş ekrandaki tek satır menü — bölümler düzleştirilmiş hali. */
export const TUM_BAGLANTILAR: Baglanti[] = BOLUMLER.flatMap((b) => b.ogeler);

/** Alt sekme çubuğunda görünmeyen, yani /menu sayfasına düşen bölümler. */
export const MENU_BOLUMLERI: Bolum[] = BOLUMLER.filter((b) => b.ad !== 'Planla');

/** Telefonun başparmak menzilindeki birincil gezinme: üç plan sekmesi + menü. */
export const SEKMELER: Baglanti[] = [
  ...BOLUMLER[0]!.ogeler,
  { ad: 'Menü', href: '/menu', ipucu: 'Öğren ve dikkat başlıkları', ikon: 'menu' },
];

/** Bir bağlantı, açık olan yolu temsil ediyor mu? */
export function aktifMi(href: string, yol: string): boolean {
  const temiz = yol.length > 1 && yol.endsWith('/') ? yol.slice(0, -1) : yol;
  return href === '/' ? temiz === '/' : temiz === href || temiz.startsWith(href + '/');
}

/**
 * Hangi sekme vurgulanacak? Açık sayfa hiçbir plan sekmesine ait değilse
 * (örneğin bir balık sayfası) "Menü" sekmesi vurgulanır — kullanıcı
 * çubuğa baktığında nerede olduğunu her zaman görür.
 */
export function aktifSekme(yol: string): string {
  const eslesen = SEKMELER.find((s) => s.href !== '/menu' && aktifMi(s.href, yol));
  return eslesen ? eslesen.href : '/menu';
}
