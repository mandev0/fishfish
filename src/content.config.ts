import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

/** 12 elemanlı ay dizisi: her ay için 0-5 arası bulunabilirlik. */
const aylar = z.array(z.number().int().min(0).max(5)).length(12);

/**
 * Su alanı. İlk dördü deniz, `gol` ve `dere` tatlı su, `aci` ikisinin karıştığı
 * lagün/dere ağzı suları. Hangisinin tatlı su sayıldığı `season.ts` içindeki
 * `SU_TURU` eşlemesinde tek yerden tanımlıdır.
 */
const suAlani = z.enum(['bogaz', 'marmara', 'karadeniz', 'halic', 'gol', 'dere', 'aci']);

const ruzgarAdi = z.enum([
  'yildiz', 'poyraz', 'gundogusu', 'kesisleme',
  'kible', 'lodos', 'gunbatisi', 'karayel',
]);

const ekipmanParcasi = z.object({
  deger: z.string(),
  not: z.string().optional(),
});

const species = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/species' }),
  schema: z.object({
    ad: z.string(),
    latin: z.string(),
    ingilizce: z.string().optional(),
    digerAdlar: z.array(z.string()).default([]),
    ozet: z.string(),
    /** Yeni başlayan için zorluk: 1 = çok kolay, 5 = uzmanlık ister. */
    zorluk: z.number().int().min(1).max(5),
    aylar,
    sular: z.array(suAlani).min(1),
    gece: z.boolean().default(false),
    boySiniflari: z.array(z.object({
      ad: z.string(),
      cm: z.string(),
      not: z.string().optional(),
    })).default([]),
    yasal: z.object({
      asgariBoy: z.number().nullable(),
      kaynak: z.string(),
      kontrolTarihi: z.string(),
      not: z.string().optional(),
      /** Tür bazlı av yasağı dönemi (iç sularda üreme yasağı gibi). */
      yasakDonemi: z.string().optional(),
    }),
    suSicakligi: z.object({
      min: z.number(),
      ideal: z.tuple([z.number(), z.number()]),
      max: z.number(),
    }),
    aktifSaatler: z.array(z.enum(['safak', 'sabah', 'oglen', 'ikindi', 'aksam', 'gece'])).min(1),
    ruzgarTercihi: z.array(ruzgarAdi).default([]),
    ruzgarKacinilan: z.array(ruzgarAdi).default([]),
    derinlik: z.string(),
    yasamAlani: z.string(),
    teshis: z.object({
      siluet: z.string(),
      ayirtEdici: z.array(z.string()).min(1),
      karistirilan: z.array(z.string()).default([]),
    }),
    takimlar: z.array(z.string()).min(1),
    yemler: z.object({
      dogal: z.array(z.string()).default([]),
      sahte: z.array(z.string()).default([]),
    }),
    ekipman: z.object({
      kamis: ekipmanParcasi,
      makine: ekipmanParcasi,
      anaMisina: ekipmanParcasi,
      sokLideri: ekipmanParcasi,
      igne: ekipmanParcasi,
      agirlik: ekipmanParcasi,
    }),
    taktik: z.object({
      atis: z.string(),
      cekme: z.string(),
      tokatlama: z.string(),
      yakalama: z.string(),
      ipuclari: z.array(z.string()).default([]),
      hatalar: z.array(z.string()).default([]),
    }),
    noktalar: z.array(z.string()).min(1),
    mutfak: z.string().optional(),
  }),
});

const spots = defineCollection({
  loader: file('./src/data/spots.json'),
  schema: z.object({
    ad: z.string(),
    il: z.enum(['istanbul', 'kocaeli', 'sakarya']),
    bolge: z.enum([
      'bogaz-rumeli', 'bogaz-anadolu', 'karadeniz',
      'marmara-avrupa', 'marmara-anadolu', 'adalar',
      'kocaeli-korfez', 'kocaeli-karadeniz',
      'istanbul-icsu', 'kocaeli-icsu', 'sapanca', 'sakarya-icsu',
    ]),
    /**
     * İdari ilçe. Bölgeden bağımsız bir eksen: Anadolu yakası hem Boğaz'ı hem
     * Marmara'yı hem Karadeniz'i kesiyor. İlçe → il ve ilçe → yaka eşlemeleri
     * `season.ts` içindedir; nokta adından çıkarım yapılmaz.
     */
    ilce: z.enum([
      'sariyer', 'besiktas', 'beyoglu', 'fatih', 'zeytinburnu', 'bakirkoy',
      'kucukcekmece', 'buyukcekmece', 'silivri',
      'beykoz', 'uskudar', 'kadikoy', 'maltepe', 'kartal', 'pendik', 'tuzla', 'sile',
      'adalar',
      'darica', 'gebze', 'dilovasi', 'korfez', 'izmit', 'golcuk', 'karamursel',
      'kandira', 'kartepe',
      'sapanca', 'adapazari',
    ]),
    su: suAlani,
    lat: z.number().min(40.6).max(41.45),
    lng: z.number().min(27.9).max(30.62),
    tip: z.array(z.enum([
      'mendirek', 'iskele', 'kayalik', 'plaj', 'kopru', 'rihtim', 'koy',
      'sazlik', 'dere-kenari',
    ])).min(1),
    ozet: z.string(),
    turler: z.array(z.string()).min(1),
    /** Bu noktada kıyıdan uygulanabilen yöntemler (src/data/methods.json). */
    yontemler: z.array(z.string()).min(1),
    ulasim: z.string(),
    otopark: z.enum(['kolay', 'orta', 'zor', 'yok']),
    geceIsigi: z.boolean(),
    /** Kuvvetli lodosta ters akıntı (orkoz) beklenen noktalar. */
    orkoz: z.boolean().default(false),
    /**
     * Open-Meteo deniz modelinin bu noktayı kapsamadığı yerler (İzmit Körfezi'nin dibi gibi
     * kapalı ve sığ sular). Dalga ve deniz suyu sıcaklığı boş gelir; arayüz bunu açıkça söyler.
     */
    denizVerisiZayif: z.boolean().default(false),
    akintiNotu: z.string().optional(),
    tehlikeler: z.array(z.string()).default([]),
    kisitlar: z.array(z.string()).default([]),
    kalabalik: z.enum(['sakin', 'orta', 'kalabalik']),
    /**
     * Noktaya özgü mevzuat notu (içme suyu havzası, üreme yasağı, izin şartı).
     * Yasal veri hafızadan yazılmaz: kaynağı ve kontrol tarihi zorunludur.
     */
    mevzuat: z.object({
      metin: z.string(),
      kaynak: z.string(),
      kontrolTarihi: z.string(),
    }).optional(),
    /** Kıyının baktığı yön (derece). Rüzgârın kıyıya mı denize mi estiğini hesaplamak için. */
    kiyiYonu: z.number().min(0).max(359),
  }),
});

const rigs = defineCollection({
  loader: file('./src/data/rigs.json'),
  schema: z.object({
    ad: z.string(),
    kisaAd: z.string(),
    ozet: z.string(),
    zorluk: z.number().int().min(1).max(5),
    turler: z.array(z.string()).min(1),
    /** Bu takımın ait olduğu yöntem (src/data/methods.json). */
    yontem: z.string(),
    /** Şema bileşeni anahtarı — src/components/svg/RigDiagram.astro içinde çizilir. */
    sema: z.string(),
    bilesenler: z.array(z.object({
      ad: z.string(),
      deger: z.string(),
      aciklama: z.string(),
      /** İlgili ekipman sayfasının kimliği (src/data/gear.json). */
      ekipman: z.string().optional(),
    })).min(1),
    kurulum: z.array(z.string()).min(1),
    dugumler: z.array(z.string()).default([]),
    ipuclari: z.array(z.string()).default([]),
    hatalar: z.array(z.string()).default([]),
  }),
});

/**
 * Yöntemler: LRF, spin, aç-çek, yemli dip gibi avlanma biçimleri.
 * Takım "neyi bağladığın", yöntem "nasıl avlandığın". Tekneden yapılan
 * yöntemler (sürütme, tekne jigi) kapsam dışıdır — site kıyı rehberidir.
 */
const methods = defineCollection({
  loader: file('./src/data/methods.json'),
  schema: z.object({
    ad: z.string(),
    kisaAd: z.string(),
    ozet: z.string(),
    zorluk: z.number().int().min(1).max(5),
    /** Aktif: yemi sen oynatırsın. Pasif: yemi bırakır, balığı beklersin. */
    tarz: z.enum(['aktif', 'pasif']),
    /** Hangi suda uygulanır. */
    sular: z.array(z.enum(['deniz', 'tatli'])).min(1),
    /** ikonlar.ts içindeki simge anahtarı. */
    ikon: z.string(),
    nedir: z.string(),
    kimeUygun: z.string(),
    nerede: z.array(z.string()).min(1),
    neZaman: z.string(),
    adimlar: z.array(z.string()).min(2),
    takimlar: z.array(z.string()).min(1),
    turler: z.array(z.string()).min(1),
    ekipman: z.array(z.string()).default([]),
    ipuclari: z.array(z.string()).default([]),
    hatalar: z.array(z.string()).default([]),
  }),
});

const knots = defineCollection({
  loader: file('./src/data/knots.json'),
  schema: z.object({
    ad: z.string(),
    /** Düğümün gördüğü iş; liste sayfası buna göre gruplar (src/lib/dugum.ts). */
    kategori: z.enum(['halka', 'hat', 'ilmek']),
    ozet: z.string(),
    kullanim: z.string(),
    zorluk: z.number().int().min(1).max(5),
    guc: z.string(),
    adimlar: z.array(z.string()).min(2),
    ipuclari: z.array(z.string()).default([]),
  }),
});

const gear = defineCollection({
  loader: file('./src/data/gear.json'),
  schema: z.object({
    ad: z.string(),
    /** Metin içinde otomatik işaretlenecek kısa ad. */
    kisaAd: z.string(),
    kategori: z.enum(['kamis', 'makine', 'misina', 'terminal', 'sahte-yem', 'dogal-yem', 'aksesuar']),
    /** Aynı şeyin sahada kullanılan diğer adları; metin taramasında da yakalanır. */
    esAdlar: z.array(z.string()).default([]),
    ozet: z.string(),
    nedir: z.string(),
    neIseYarar: z.array(z.string()).default([]),
    nasilSecilir: z.array(z.object({ baslik: z.string(), metin: z.string() })).default([]),
    dikkat: z.array(z.string()).default([]),
    ilgili: z.array(z.string()).default([]),
    dugumler: z.array(z.string()).default([]),
  }),
});

export const collections = { species, spots, methods, rigs, knots, gear };
