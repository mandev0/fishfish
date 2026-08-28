/**
 * Takım şemalarında geçen etiketlerin karşılıkları.
 *
 * SVG içindeki metinlere balon eklenemediği için, her şemanın altına
 * "şemada ne görüyorsun" lejantı basıyoruz: etiket → ilgili sayfa.
 */
export interface SemaEtiketi {
  /** Şemada yazan metin. */
  etiket: string;
  /** Hedef sayfa türü. */
  tur: 'ekipman' | 'dugum';
  id: string;
}

export const SEMA_ETIKETLERI: Record<string, SemaEtiketi[]> = {
  capari: [
    { etiket: 'Kamış ucu', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Çapari bedeni', tur: 'ekipman', id: 'beden' },
    { etiket: 'Tüylü iğne', tur: 'ekipman', id: 'igne' },
    { etiket: 'Armut kurşun', tur: 'ekipman', id: 'kursun' },
  ],
  samandira: [
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'Kauçuk stoper', tur: 'ekipman', id: 'stoper' },
    { etiket: 'Kayar şamandıra', tur: 'ekipman', id: 'samandira' },
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Fluorocarbon köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'Canlı yem', tur: 'ekipman', id: 'canli-yem' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
  ],
  zoka: [
    { etiket: 'Kamış', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Örgü ana misina (PE)', tur: 'ekipman', id: 'orgu-misina' },
    { etiket: 'FG düğümü', tur: 'dugum', id: 'fg' },
    { etiket: 'Şok lideri', tur: 'ekipman', id: 'sok-lideri' },
    { etiket: 'Kilitli klips', tur: 'ekipman', id: 'klips' },
    { etiket: 'Metal zoka', tur: 'ekipman', id: 'zoka' },
  ],
  spin: [
    { etiket: 'Kamış', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Örgü PE', tur: 'ekipman', id: 'orgu-misina' },
    { etiket: 'FG düğümü', tur: 'dugum', id: 'fg' },
    { etiket: 'Fluorocarbon lider', tur: 'ekipman', id: 'sok-lideri' },
    { etiket: 'Klips', tur: 'ekipman', id: 'klips' },
    { etiket: 'Minnow maket', tur: 'ekipman', id: 'maket-balik' },
    { etiket: 'Dalgıç (lip)', tur: 'ekipman', id: 'maket-balik' },
  ],
  dip: [
    { etiket: 'Surf kamışı', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'Kayar kurşun', tur: 'ekipman', id: 'kursun' },
    { etiket: 'Boncuk', tur: 'ekipman', id: 'boncuk' },
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
  ],
  paternoster: [
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Beden', tur: 'ekipman', id: 'beden' },
    { etiket: 'Köstek bağı (ilmek)', tur: 'dugum', id: 'kostek-bagi' },
    { etiket: 'Köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
    { etiket: 'Piramit kurşun', tur: 'ekipman', id: 'kursun' },
  ],
  lrf: [
    { etiket: 'Solid tip kamış', tur: 'ekipman', id: 'solid-tip' },
    { etiket: 'Örgü PE', tur: 'ekipman', id: 'orgu-misina' },
    { etiket: 'FG düğümü', tur: 'dugum', id: 'fg' },
    { etiket: 'Fluorocarbon', tur: 'ekipman', id: 'fluorocarbon' },
    { etiket: 'Jig head', tur: 'ekipman', id: 'jig-head' },
    { etiket: 'Silikon yem', tur: 'ekipman', id: 'silikon-yem' },
  ],
  egi: [
    { etiket: 'Egging kamışı', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Örgü PE', tur: 'ekipman', id: 'orgu-misina' },
    { etiket: 'FG düğümü', tur: 'dugum', id: 'fg' },
    { etiket: 'Fluorocarbon', tur: 'ekipman', id: 'fluorocarbon' },
    { etiket: 'Egi (kalamar zokası)', tur: 'ekipman', id: 'egi' },
  ],
  surf: [
    { etiket: 'Surf kamışı', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'FG düğümü', tur: 'dugum', id: 'fg' },
    { etiket: 'Şok lideri', tur: 'ekipman', id: 'sok-lideri' },
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Beden', tur: 'ekipman', id: 'beden' },
    { etiket: 'Köstek bağı', tur: 'dugum', id: 'kostek-bagi' },
    { etiket: 'Köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
    { etiket: 'Tırnaklı kurşun', tur: 'ekipman', id: 'kursun' },
  ],
  feeder: [
    { etiket: 'Feeder kamışı', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'Yemlik kafes', tur: 'ekipman', id: 'feeder-kafesi' },
    { etiket: 'Boncuk', tur: 'ekipman', id: 'boncuk' },
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
    { etiket: 'Mısır', tur: 'ekipman', id: 'misir' },
  ],
  sazan: [
    { etiket: 'Kamış', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'Kayar armut kurşun', tur: 'ekipman', id: 'kursun' },
    { etiket: 'Boncuk', tur: 'ekipman', id: 'boncuk' },
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
    { etiket: 'Mısır', tur: 'ekipman', id: 'misir' },
  ],
  'tatli-samandira': [
    { etiket: 'Kamış', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'Üst stoper', tur: 'ekipman', id: 'stoper' },
    { etiket: 'Kalem şamandıra', tur: 'ekipman', id: 'samandira' },
    { etiket: 'Alt stoper', tur: 'ekipman', id: 'stoper' },
    { etiket: 'Saçma kurşun', tur: 'ekipman', id: 'kursun' },
    { etiket: 'Köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
  ],
  'spin-tatli': [
    { etiket: 'Kamış', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Örgü ana misina', tur: 'ekipman', id: 'orgu-misina' },
    { etiket: 'FG düğümü', tur: 'dugum', id: 'fg' },
    { etiket: 'Klipsli fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Çelik lider', tur: 'ekipman', id: 'celik-lider' },
    { etiket: 'Klips', tur: 'ekipman', id: 'klips' },
    { etiket: 'Dönen kanat', tur: 'ekipman', id: 'spinner' },
  ],
  kefal: [
    { etiket: 'Match kamışı', tur: 'ekipman', id: 'kamis' },
    { etiket: 'Ana misina', tur: 'ekipman', id: 'monofilament' },
    { etiket: 'Stoper', tur: 'ekipman', id: 'stoper' },
    { etiket: 'Kalem şamandıra', tur: 'ekipman', id: 'samandira' },
    { etiket: 'Saçma kurşun', tur: 'ekipman', id: 'kursun' },
    { etiket: 'Fırdöndü', tur: 'ekipman', id: 'firdondu' },
    { etiket: 'Köstek', tur: 'ekipman', id: 'kostek' },
    { etiket: 'İğne', tur: 'ekipman', id: 'igne' },
  ],
};
