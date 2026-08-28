import { describe, expect, it } from 'vitest';
import spots from '../src/data/spots.json';
import { BOLGE_ADLARI, BOLGE_ILI, bolgeTamAdi, IL_ADLARI, SU_ADLARI, SU_KISA_ADLARI } from '../src/lib/season';

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
