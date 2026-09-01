import { describe, expect, it } from 'vitest';
import { ilmek, ok, olcu, sarim } from '../src/lib/semaIp';

/** Yol dizesindeki bütün (x, y) çiftlerini çıkarır. */
function noktalar(d: string): [number, number][] {
  const sayilar = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const cift: [number, number][] = [];
  for (let i = 0; i + 1 < sayilar.length; i += 2) cift.push([sayilar[i]!, sayilar[i + 1]!]);
  return cift;
}

describe('sarım geometrisi', () => {
  const s = { x: 100, y: 80, adet: 6, adim: 26, yaricap: 11 };

  it('her tur bir arka bir ön yarım üretir', () => {
    const p = sarim(s);
    expect(p).toHaveLength(12);
    expect(p.filter((q) => q.on)).toHaveLength(6);
    // Sıra "arka, ön" olmalı: çizim sırası üst/alt bilgisini taşıyor.
    expect(p.map((q) => q.on)).toEqual([false, true, false, true, false, true, false, true, false, true, false, true]);
  });

  it('sarım eksen boyunca ilerler ve verilen aralıkta kalır', () => {
    const hepsi = sarim(s).flatMap((p) => noktalar(p.d));
    const x = hepsi.map((n) => n[0]);
    // İlk turun merkezi x=100; tur başına yarım adım öne ve arkaya taşar.
    expect(Math.min(...x)).toBeCloseTo(100 - 26 / 2, 1);
    expect(Math.max(...x)).toBeCloseTo(100 + 26 * 5.5, 1);
  });

  it('ön yarım eksenin bir yanından diğerine geçer', () => {
    const on = sarim(s).find((p) => p.on)!;
    const y = noktalar(on.d).map((n) => n[1]);
    expect(Math.min(...y)).toBeCloseTo(80 - 11, 1);
    expect(Math.max(...y)).toBeCloseTo(80 + 11, 1);
  });

  it('90 derecelik eksende sarım dikey ilerler', () => {
    const hepsi = sarim({ ...s, aci: 90 }).flatMap((p) => noktalar(p.d));
    const y = hepsi.map((n) => n[1]);
    expect(Math.min(...y)).toBeCloseTo(80 - 13, 1);
    expect(Math.max(...y)).toBeCloseTo(80 + 26 * 5.5, 1);
  });
});

describe('yön oku', () => {
  it('gövde başlangıçtan çıkar, uç üçgeni hedefe değer', () => {
    const o = ok(20, 20, 120, 60);
    expect(o.govde.startsWith('M20 20')).toBe(true);
    const uc = noktalar(o.uc);
    expect(uc).toHaveLength(3);
    expect(uc[0]).toEqual([120, 60]);
  });

  it('kavis kontrol noktasını dik yönde kaydırır', () => {
    const duz = ok(0, 0, 100, 0, { kavis: 0 });
    const egri = ok(0, 0, 100, 0, { kavis: 30 });
    expect(duz.govde).not.toEqual(egri.govde);
    // Yatay okta pozitif kavis kontrol noktasını aşağı taşır.
    expect(egri.govde).toContain('Q50 30');
  });
});

describe('ölçü ve ilmek', () => {
  it('ölçü çizgisi iki uçta tırnak taşır', () => {
    const d = olcu(40, 140, 100, 5);
    expect(d).toContain('M40 100 L140 100');
    expect(d).toContain('M40 95 L40 105');
    expect(d).toContain('M140 95 L140 105');
  });

  it('ilmek iki kolu yarım çemberle birleştirir', () => {
    const d = ilmek(30, 60, 90, 120);
    expect(d.startsWith('M150 60')).toBe(true);
    expect(d).toContain('A15 15');
    expect(d.endsWith('150 90')).toBe(true);
  });
});
