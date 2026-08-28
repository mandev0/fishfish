import { describe, expect, it } from 'vitest';
import { egriden, skorHesapla, turleriSirala, type Kosullar, type TurProfili } from '../src/lib/score';

/** Gerçek lüfer profilinin skor için gereken kısmı. */
const lufer: TurProfili = {
  id: 'lufer', ad: 'Lüfer',
  aylar: [3, 2, 2, 1, 1, 1, 1, 2, 4, 5, 5, 4],
  gece: true,
  suSicakligi: { min: 12, ideal: [15, 22], max: 25 },
  aktifSaatler: ['safak', 'aksam', 'gece'],
  ruzgarTercihi: ['poyraz', 'yildiz'],
  ruzgarKacinilan: ['lodos', 'kible'],
};

/** Ekim ayında, akşam alacasında, poyrazlı ideal koşullar. */
const idealKosul: Kosullar = {
  tarih: new Date('2026-10-15T19:00:00+03:00'),
  suSicakligi: 18,
  dalga: 0.3,
  ruzgarHizi: 12,
  ruzgarYonu: 45,       // poyraz
  ruzgarHamlesi: 18,
  basincEgilimi: -1.5,  // hafif düşüş
  bulut: 50,
  yagis: 0,
  gunDogumu: new Date('2026-10-15T07:20:00+03:00'),
  gunBatimi: new Date('2026-10-15T18:40:00+03:00'),
  kiyiYonu: 90,
};

describe('egriden', () => {
  it('tablo dışı değerlerde uç noktaları kullanır', () => {
    const egri: [number, number][] = [[0, 0.5], [10, 1]];
    expect(egriden(egri, -5)).toBe(0.5);
    expect(egriden(egri, 50)).toBe(1);
  });

  it('ara değerleri doğrusal yorumlar', () => {
    const egri: [number, number][] = [[0, 0], [10, 1]];
    expect(egriden(egri, 5)).toBeCloseTo(0.5, 5);
    expect(egriden(egri, 2.5)).toBeCloseTo(0.25, 5);
  });
});

describe('skorHesapla', () => {
  it('sezonun zirvesinde ideal koşullarda yüksek skor verir', () => {
    const s = skorHesapla(lufer, idealKosul);
    expect(s.skor).toBeGreaterThan(70);
    expect(s.seviye).toBe('cokIyi');
    expect(s.tehlike).toBe(false);
    expect(s.uyarilar).toHaveLength(0);
  });

  it('aynı koşullar sezon dışında çok daha düşük skor verir', () => {
    const ekim = skorHesapla(lufer, idealKosul);
    const haziran = skorHesapla(lufer, {
      ...idealKosul,
      tarih: new Date('2026-06-15T19:00:00+03:00'),
    });
    expect(haziran.skor).toBeLessThan(ekim.skor / 2);
  });

  it('lodos fırtınasında tehlike bayrağı kaldırır ve skoru kırpar', () => {
    const s = skorHesapla(lufer, {
      ...idealKosul,
      ruzgarHizi: 55,
      ruzgarHamlesi: 75,
      ruzgarYonu: 225,  // lodos
      dalga: 2.1,
    });
    expect(s.tehlike).toBe(true);
    expect(s.skor).toBeLessThanOrEqual(40);
    expect(s.uyarilar.length).toBeGreaterThanOrEqual(2);
    expect(s.uyarilar.some((u) => u.includes('Dalga'))).toBe(true);
  });

  it('rüzgâr yönünü tür tercihine göre puanlar', () => {
    const poyraz = skorHesapla(lufer, idealKosul);
    const lodos = skorHesapla(lufer, { ...idealKosul, ruzgarYonu: 225 });
    const f = (s: typeof poyraz) => s.faktorler.find((x) => x.id === 'ruzgarYonu')!;
    expect(f(poyraz).puan).toBe(1);
    expect(f(lodos).puan).toBe(0.25);
    expect(poyraz.skor).toBeGreaterThan(lodos.skor);
  });

  it('su sıcaklığı ideal aralığın dışına çıkınca puan düşer', () => {
    const ideal = skorHesapla(lufer, idealKosul);
    const soguk = skorHesapla(lufer, { ...idealKosul, suSicakligi: 6 });
    const g = (s: typeof ideal) => s.faktorler.find((x) => x.id === 'suSicakligi')!;
    expect(g(ideal).puan).toBe(1);
    expect(g(soguk).puan).toBeLessThan(0.3);
  });

  it('hiç canlı veri yokken mevsime dayanır ve çökmeden sonuç üretir', () => {
    const s = skorHesapla(lufer, { tarih: new Date('2026-10-15T19:00:00+03:00') });
    expect(s.sadeceMevsim).toBe(false); // saat ve ay evresi faktörleri hep hesaplanır
    expect(s.skor).toBeGreaterThan(0);
    expect(s.faktorler.filter((f) => f.veriYok).length).toBeGreaterThanOrEqual(4);
    expect(s.faktorler.filter((f) => f.veriYok).every((f) => f.agirlik === 0)).toBe(true);
  });

  it('veri eksikse o faktör ortalamayı bozmaz', () => {
    const tam = skorHesapla(lufer, idealKosul);
    const dalgasiz = skorHesapla(lufer, { ...idealKosul, dalga: null });
    // Dalga zaten ideale yakındı; çıkarılınca skor uçmamalı.
    expect(Math.abs(tam.skor - dalgasiz.skor)).toBeLessThan(6);
  });

  it('gece avlanmayan türde ay evresi faktörü hiç eklenmez', () => {
    const gunduzTur: TurProfili = { ...lufer, id: 'x', gece: false };
    const s = skorHesapla(gunduzTur, idealKosul);
    expect(s.faktorler.some((f) => f.id === 'ayEvresi')).toBe(false);
  });

  it('skor her zaman 0-100 arasında kalır', () => {
    for (const kosul of [
      idealKosul,
      { ...idealKosul, suSicakligi: 40, dalga: 8, ruzgarHizi: 200, basincEgilimi: 30 },
      { ...idealKosul, suSicakligi: -5, dalga: 0, ruzgarHizi: 0, basincEgilimi: -30 },
    ]) {
      const s = skorHesapla(lufer, kosul as Kosullar);
      expect(s.skor).toBeGreaterThanOrEqual(0);
      expect(s.skor).toBeLessThanOrEqual(100);
    }
  });
});

describe('turleriSirala', () => {
  it('skora göre azalan sırada döndürür', () => {
    const mezgit: TurProfili = {
      id: 'mezgit', ad: 'Mezgit',
      aylar: [5, 5, 4, 3, 2, 1, 1, 1, 2, 3, 4, 5],
      gece: true,
      suSicakligi: { min: 6, ideal: [8, 14], max: 18 },
      aktifSaatler: ['safak', 'aksam', 'gece'],
      ruzgarTercihi: ['poyraz'], ruzgarKacinilan: [],
    };
    const sirali = turleriSirala([mezgit, lufer], idealKosul);
    // Ekim + 18 °C su lüferin lehine, mezgitin aleyhine.
    expect(sirali[0]!.tur.id).toBe('lufer');
    expect(sirali[0]!.sonuc.skor).toBeGreaterThanOrEqual(sirali[1]!.sonuc.skor);
  });
});
