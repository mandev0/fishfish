import { describe, expect, it } from 'vitest';
import spots from '../src/data/spots.json';
import {
  BOLGE_ADLARI, BOLGE_ILI, bolgeTamAdi, IL_ADLARI, ILCE_ADLARI, ILCE_ILI, ILCE_YAKASI,
  SU_ADLARI, SU_KISA_ADLARI, YAKA_ADLARI,
} from '../src/lib/season';

const bolgeler = [...new Set(spots.map((s) => s.bolge))];
const iller = [...new Set(spots.map((s) => s.il))];
const sular = [...new Set(spots.map((s) => s.su))];

describe('bölge ve il eşlemesi', () => {
  it('verideki her bölgenin bir adı var', () => {
    for (const b of bolgeler) expect(BOLGE_ADLARI[b], `"${b}" için ad yok`).toBeTruthy();
  });

  it('verideki her bölge bir ile bağlı', () => {
    for (const b of bolgeler) expect(BOLGE_ILI[b], `"${b}" için il yok`).toBeTruthy();
  });

  it('verideki her ilin bir adı var', () => {
    for (const il of iller) expect(IL_ADLARI[il], `"${il}" için ad yok`).toBeTruthy();
  });

  it('BOLGE_ILI eşlemesi noktaların kendi il alanıyla çakışmıyor', () => {
    // Bağımlı seçim kutuları bu eşlemeye güveniyor; sapması sessiz bir hata olur.
    for (const s of spots) {
      expect(BOLGE_ILI[s.bolge], `${s.id}: bölge "${s.bolge}" → il uyuşmazlığı`).toBe(s.il);
    }
  });

  it('tam ad il ile bölgeyi birlikte verir', () => {
    expect(bolgeTamAdi('kocaeli-korfez')).toBe('Kocaeli — İzmit Körfezi');
    expect(bolgeTamAdi('bogaz-rumeli')).toBe('İstanbul — Boğaz — Rumeli Yakası');
  });

  it('bilinmeyen bölgede patlamaz', () => {
    expect(bolgeTamAdi('yok-boyle-bir-sey')).toBe('yok-boyle-bir-sey');
  });

  it('her ilde en az bir nokta var', () => {
    for (const il of Object.keys(IL_ADLARI)) {
      expect(spots.filter((s) => s.il === il).length, `${il} boş`).toBeGreaterThan(0);
    }
  });
});

describe('su adları', () => {
  it('verideki her suyun tam adı var', () => {
    for (const su of sular) expect(SU_ADLARI[su], `"${su}" için ad yok`).toBeTruthy();
  });

  it('kısa ad eşlemesi tam ad eşlemesiyle aynı anahtarları taşır', () => {
    // Rozetler kısa adı okuyor; biri eklenip diğeri unutulursa sessizce
    // tam ada düşer ve dar rozetten taşar.
    expect(Object.keys(SU_KISA_ADLARI).sort()).toEqual(Object.keys(SU_ADLARI).sort());
  });

  it('kısa ad tam addan uzun değildir', () => {
    for (const [k, kisa] of Object.entries(SU_KISA_ADLARI)) {
      expect(kisa.length, `"${k}" kısa adı uzun`).toBeLessThanOrEqual(SU_ADLARI[k]!.length);
    }
  });
});

describe('ilçe ve yaka eşlemesi', () => {
  const ilceler = [...new Set(spots.map((s) => s.ilce))];

  it('her noktanın ilçesi var ve adı tanımlı', () => {
    for (const s of spots) {
      expect(s.ilce, `${s.id}: ilçe yazılmamış`).toBeTruthy();
      expect(ILCE_ADLARI[s.ilce], `${s.id}: "${s.ilce}" için ad yok`).toBeTruthy();
    }
  });

  it('ILCE_ILI eşlemesi noktaların kendi il alanıyla çakışmıyor', () => {
    // İlçe çipleri il seçimine göre daraltılıyor; sapması çipi yanlış ilde gösterir.
    for (const s of spots) {
      expect(ILCE_ILI[s.ilce], `${s.id}: ilçe "${s.ilce}" → il uyuşmazlığı`).toBe(s.il);
    }
  });

  it('ILCE_ADLARI ile ILCE_ILI aynı ilçeleri kapsıyor', () => {
    expect(Object.keys(ILCE_ADLARI).sort()).toEqual(Object.keys(ILCE_ILI).sort());
  });

  it('tanımlı her ilçenin en az bir noktası var', () => {
    // Kullanılmayan ilçe süzgeçte hiç sonuç vermeyen bir çip olurdu.
    for (const id of Object.keys(ILCE_ADLARI)) {
      expect(ilceler, `"${id}" ilçesinde nokta yok`).toContain(id);
    }
  });

  it('her yaka gerçek bir ilçeye ve tanımlı bir ada bağlı', () => {
    for (const [ilce, yaka] of Object.entries(ILCE_YAKASI)) {
      expect(ILCE_ADLARI[ilce], `ILCE_YAKASI: bilinmeyen ilçe "${ilce}"`).toBeTruthy();
      expect(YAKA_ADLARI[yaka], `"${ilce}" için yaka adı yok ("${yaka}")`).toBeTruthy();
    }
  });

  it('bir yaka tek bir ile aittir', () => {
    // Yaka çipleri de il seçimine göre daraltılıyor; iki ile yayılan bir yaka
    // çipi yanlış ilde görünür bırakırdı.
    const yakaIli: Record<string, string> = {};
    for (const [ilce, yaka] of Object.entries(ILCE_YAKASI)) {
      const il = ILCE_ILI[ilce]!;
      if (yakaIli[yaka]) expect(yakaIli[yaka], `"${yaka}" iki ile yayılıyor`).toBe(il);
      else yakaIli[yaka] = il;
    }
  });

  it('yaka bölgeden bağımsız bir eksen — ikisi birebir örtüşmüyor', () => {
    // Örtüşselerdi ayrı bir süzgeç olmasının anlamı kalmazdı: Anadolu yakası
    // Boğaz, Marmara ve Karadeniz bölgelerinin üçünü birden kesiyor.
    const anadoluBolgeleri = new Set(
      spots.filter((s) => ILCE_YAKASI[s.ilce] === 'anadolu').map((s) => s.bolge),
    );
    expect(anadoluBolgeleri.size).toBeGreaterThan(1);
  });
});
