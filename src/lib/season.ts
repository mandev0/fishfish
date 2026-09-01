export const AY_ADLARI = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

export const AY_KISA = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
] as const;

/** 0-5 arası bulunabilirlik değerinin sözel karşılığı. */
export const BULUNABILIRLIK = [
  'Yok denecek kadar az',
  'Çok seyrek',
  'Ara sıra',
  'Tutulur',
  'Bol',
  'Sezonun zirvesi',
] as const;

export function bulunabilirlikMetni(deger: number): string {
  return BULUNABILIRLIK[Math.max(0, Math.min(5, Math.round(deger)))]!;
}

/** 1-12 arası ay numarasını 0-11 dizi indeksine çevirir, sınırları kırpar. */
export function ayIndeksi(ay: number): number {
  return Math.max(0, Math.min(11, Math.round(ay) - 1));
}

export const SU_ADLARI: Record<string, string> = {
  bogaz: 'İstanbul Boğazı',
  marmara: 'Marmara Denizi',
  karadeniz: 'Karadeniz',
  halic: 'Haliç',
  gol: 'Göl ve baraj gölü',
  dere: 'Dere ve nehir',
  aci: 'Acı su (göl ile denizin karıştığı yer)',
};

/**
 * Rozet ve çip gibi dar yerler için kısa su adları. Tam addan string kırparak
 * türetme: "İstanbul Boğazı" → "Boğazı" gibi bozuk çekimler çıkıyor.
 */
export const SU_KISA_ADLARI: Record<string, string> = {
  bogaz: 'Boğaz',
  marmara: 'Marmara',
  karadeniz: 'Karadeniz',
  halic: 'Haliç',
  gol: 'Göl',
  dere: 'Dere',
  aci: 'Acı su',
};

/**
 * Su alanının tuzluluk sınıfı. Tek kaynak burasıdır: hava paneli, skor motoru
 * ve nokta rozetleri "burada deniz verisi olur mu" sorusunu buradan yanıtlar.
 * Bölge veya nokta adından çıkarım yapma.
 */
export const SU_TURU: Record<string, 'deniz' | 'tatli' | 'aci'> = {
  bogaz: 'deniz',
  marmara: 'deniz',
  karadeniz: 'deniz',
  halic: 'deniz',
  gol: 'tatli',
  dere: 'tatli',
  aci: 'aci',
};

export const SU_TURU_ADLARI: Record<string, string> = {
  deniz: 'Deniz',
  tatli: 'Tatlı su',
  aci: 'Acı su',
};

/** Deniz modeli (dalga, deniz suyu sıcaklığı) bu suyu kapsamaz mı? */
export function tatliSuMu(su: string): boolean {
  return SU_TURU[su] === 'tatli';
}

export const IL_ADLARI: Record<string, string> = {
  istanbul: 'İstanbul',
  kocaeli: 'Kocaeli',
  sakarya: 'Sakarya',
};

/** Hangi bölge hangi ile ait — bağımlı seçim kutuları için. */
export const BOLGE_ILI: Record<string, string> = {
  'bogaz-rumeli': 'istanbul',
  'bogaz-anadolu': 'istanbul',
  'karadeniz': 'istanbul',
  'marmara-avrupa': 'istanbul',
  'marmara-anadolu': 'istanbul',
  'adalar': 'istanbul',
  'kocaeli-korfez': 'kocaeli',
  'kocaeli-karadeniz': 'kocaeli',
  'istanbul-icsu': 'istanbul',
  'kocaeli-icsu': 'kocaeli',
  'sapanca': 'sakarya',
  'sakarya-icsu': 'sakarya',
};

export const BOLGE_ADLARI: Record<string, string> = {
  'bogaz-rumeli': 'Boğaz — Rumeli Yakası',
  'bogaz-anadolu': 'Boğaz — Anadolu Yakası',
  'karadeniz': 'Karadeniz Kıyısı',
  'marmara-avrupa': 'Marmara — Avrupa Yakası',
  'marmara-anadolu': 'Marmara — Anadolu Yakası',
  'adalar': 'Adalar',
  'kocaeli-korfez': 'İzmit Körfezi',
  'kocaeli-karadeniz': 'Kandıra Kıyısı',
  'istanbul-icsu': 'İç Sular — Dereler',
  'kocaeli-icsu': 'İç Sular — Sapanca Batı Kıyısı',
  'sapanca': 'Sapanca Gölü',
  'sakarya-icsu': 'İç Sular — Nehir ve Göller',
};

/**
 * İlçeler.
 *
 * Bölge su alanına göre bölünür (Boğaz, Marmara, Karadeniz), ilçe ise idari
 * bölünmedir; ikisi kesişir ama biri diğerinden çıkarılamaz. Nokta adından
 * ilçe çıkarma: "Arnavutköy" hem Beşiktaş'ın Boğaz mahallesi hem ayrı bir
 * ilçedir, "Ağva" Şile'nin mahallesidir. Eşleme burada, tek yerde durur.
 */
export const ILCE_ADLARI: Record<string, string> = {
  // İstanbul — Avrupa
  sariyer: 'Sarıyer',
  besiktas: 'Beşiktaş',
  beyoglu: 'Beyoğlu',
  fatih: 'Fatih',
  zeytinburnu: 'Zeytinburnu',
  bakirkoy: 'Bakırköy',
  kucukcekmece: 'Küçükçekmece',
  buyukcekmece: 'Büyükçekmece',
  silivri: 'Silivri',
  // İstanbul — Anadolu
  beykoz: 'Beykoz',
  uskudar: 'Üsküdar',
  kadikoy: 'Kadıköy',
  maltepe: 'Maltepe',
  kartal: 'Kartal',
  pendik: 'Pendik',
  tuzla: 'Tuzla',
  sile: 'Şile',
  // İstanbul — Adalar
  adalar: 'Adalar',
  // Kocaeli
  darica: 'Darıca',
  gebze: 'Gebze',
  dilovasi: 'Dilovası',
  korfez: 'Körfez',
  izmit: 'İzmit',
  golcuk: 'Gölcük',
  karamursel: 'Karamürsel',
  kandira: 'Kandıra',
  kartepe: 'Kartepe',
  // Sakarya
  sapanca: 'Sapanca',
  adapazari: 'Adapazarı',
};

/** Hangi ilçe hangi ile ait — bağımlı süzgeç ve doğrulama için. */
export const ILCE_ILI: Record<string, string> = {
  sariyer: 'istanbul', besiktas: 'istanbul', beyoglu: 'istanbul', fatih: 'istanbul',
  zeytinburnu: 'istanbul', bakirkoy: 'istanbul', kucukcekmece: 'istanbul',
  buyukcekmece: 'istanbul', silivri: 'istanbul',
  beykoz: 'istanbul', uskudar: 'istanbul', kadikoy: 'istanbul', maltepe: 'istanbul',
  kartal: 'istanbul', pendik: 'istanbul', tuzla: 'istanbul', sile: 'istanbul',
  adalar: 'istanbul',
  darica: 'kocaeli', gebze: 'kocaeli', dilovasi: 'kocaeli', korfez: 'kocaeli',
  izmit: 'kocaeli', golcuk: 'kocaeli', karamursel: 'kocaeli', kandira: 'kocaeli',
  kartepe: 'kocaeli',
  sapanca: 'sakarya', adapazari: 'sakarya',
};

/**
 * Yaka — ilçelerin üstündeki kaba bölünme.
 *
 * "Anadolu yakasındayım, nereye gideyim?" gerçek bir soru ve bölgeyle
 * cevaplanamıyor: Anadolu yakası hem Boğaz'ı hem Marmara'yı hem Karadeniz'i
 * kesiyor. Kocaeli'nde aynı soru körfezin hangi kıyısında olduğundur —
 * karşıya geçmek yarım saatlik bir karardır.
 *
 * Sakarya'da böyle bir bölünme yok; oradaki ilçeler yakasız kalır ve
 * süzgeçte il adı altında listelenir.
 */
export const YAKA_ADLARI: Record<string, string> = {
  avrupa: 'Avrupa Yakası',
  anadolu: 'Anadolu Yakası',
  'istanbul-adalar': 'Adalar',
  'korfez-kuzey': 'Körfez Kuzeyi',
  'korfez-guney': 'Körfez Güneyi',
  'kocaeli-kuzey': 'Kandıra Kıyısı',
};

/** İlçe → yaka. Burada olmayan ilçe yakasızdır. */
export const ILCE_YAKASI: Record<string, string> = {
  sariyer: 'avrupa', besiktas: 'avrupa', beyoglu: 'avrupa', fatih: 'avrupa',
  zeytinburnu: 'avrupa', bakirkoy: 'avrupa', kucukcekmece: 'avrupa',
  buyukcekmece: 'avrupa', silivri: 'avrupa',
  beykoz: 'anadolu', uskudar: 'anadolu', kadikoy: 'anadolu', maltepe: 'anadolu',
  kartal: 'anadolu', pendik: 'anadolu', tuzla: 'anadolu', sile: 'anadolu',
  adalar: 'istanbul-adalar',
  darica: 'korfez-kuzey', gebze: 'korfez-kuzey', dilovasi: 'korfez-kuzey',
  korfez: 'korfez-kuzey', izmit: 'korfez-kuzey',
  golcuk: 'korfez-guney', karamursel: 'korfez-guney',
  kandira: 'kocaeli-kuzey',
};

/** Bölgenin il adıyla birlikte tam karşılığı. */
export function bolgeTamAdi(bolge: string): string {
  const il = IL_ADLARI[BOLGE_ILI[bolge] ?? ''] ?? '';
  return il ? `${il} — ${BOLGE_ADLARI[bolge] ?? bolge}` : (BOLGE_ADLARI[bolge] ?? bolge);
}

export const SAAT_ADLARI: Record<string, string> = {
  safak: 'Şafak',
  sabah: 'Sabah',
  oglen: 'Öğlen',
  ikindi: 'İkindi',
  aksam: 'Akşam alacası',
  gece: 'Gece',
};

export const TIP_ADLARI: Record<string, string> = {
  mendirek: 'Mendirek',
  iskele: 'İskele',
  kayalik: 'Kayalık',
  plaj: 'Plaj / kum',
  kopru: 'Köprü',
  rihtim: 'Rıhtım',
  koy: 'Koy',
  sazlik: 'Sazlık',
  'dere-kenari': 'Dere kenarı',
};

/** İstanbul saatiyle şimdiki zamanın hangi zaman dilimine düştüğü. */
export function saatDilimi(saat: number): keyof typeof SAAT_ADLARI {
  if (saat < 5) return 'gece';
  if (saat < 8) return 'safak';
  if (saat < 11) return 'sabah';
  if (saat < 15) return 'oglen';
  if (saat < 18) return 'ikindi';
  if (saat < 21) return 'aksam';
  return 'gece';
}
