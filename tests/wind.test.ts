import { describe, expect, it } from 'vitest';
import { beaufort, beaufortAdi, kiyiIliskisi, normalizeDerece, ruzgarAdi } from '../src/lib/wind';

describe('rüzgâr gülü', () => {
  it('dereceyi Türkçe rüzgâr adına çevirir', () => {
    expect(ruzgarAdi(0)).toBe('yildiz');
    expect(ruzgarAdi(45)).toBe('poyraz');
    expect(ruzgarAdi(90)).toBe('gundogusu');
    expect(ruzgarAdi(135)).toBe('kesisleme');
    expect(ruzgarAdi(180)).toBe('kible');
    expect(ruzgarAdi(225)).toBe('lodos');
    expect(ruzgarAdi(270)).toBe('gunbatisi');
    expect(ruzgarAdi(315)).toBe('karayel');
  });

  it('dilim sınırlarında en yakın yöne yuvarlar', () => {
    expect(ruzgarAdi(359)).toBe('yildiz');
    expect(ruzgarAdi(23)).toBe('poyraz');
    expect(ruzgarAdi(22)).toBe('yildiz');
    expect(ruzgarAdi(247)).toBe('lodos');
  });

  it('negatif ve 360 üstü dereceleri normalize eder', () => {
    expect(normalizeDerece(-45)).toBe(315);
    expect(normalizeDerece(405)).toBe(45);
    expect(ruzgarAdi(-45)).toBe('karayel');
    expect(ruzgarAdi(405)).toBe('poyraz');
  });
});

describe('beaufort', () => {
  it('bilinen eşikleri doğru sınıflar', () => {
    expect(beaufort(0)).toBe(0);
    expect(beaufort(10)).toBe(2);
    expect(beaufort(25)).toBe(4);
    expect(beaufort(45)).toBe(6);
    expect(beaufort(130)).toBe(12);
  });

  it('her seviye için Türkçe ad döndürür', () => {
    expect(beaufortAdi(0)).toBe('Durgun');
    expect(beaufortAdi(25)).toBe('Orta rüzgâr');
    expect(beaufortAdi(200)).toBe('Orkan');
  });
});

describe('kıyı ilişkisi', () => {
  // Kıyı doğuya (90°) bakıyor: doğudan gelen rüzgâr denizden kıyıya eser.
  it('kıyının baktığı yönden gelen rüzgârı denizden sayar', () => {
    expect(kiyiIliskisi(90, 90)).toBe('denizden');
    expect(kiyiIliskisi(120, 90)).toBe('denizden');
  });

  it('ters yönden gelen rüzgârı karadan sayar', () => {
    expect(kiyiIliskisi(270, 90)).toBe('karadan');
    expect(kiyiIliskisi(240, 90)).toBe('karadan');
  });

  it('kıyıya paralel rüzgârı yandan sayar', () => {
    expect(kiyiIliskisi(0, 90)).toBe('yandan');
    expect(kiyiIliskisi(180, 90)).toBe('yandan');
  });

  it('0/360 sınırını doğru geçer', () => {
    expect(kiyiIliskisi(350, 0)).toBe('denizden');
    expect(kiyiIliskisi(10, 0)).toBe('denizden');
    expect(kiyiIliskisi(180, 0)).toBe('karadan');
  });
});
