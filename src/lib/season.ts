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
