import { describe, expect, it } from 'vitest';
import { ayEvresi } from '../src/lib/moon';

describe('ay evresi', () => {
  it('referans yeni ayda yeni ay döndürür', () => {
    const e = ayEvresi(new Date(Date.UTC(2000, 0, 6, 18, 14)));
    expect(e.id).toBe('yeni');
    expect(e.aydinlanma).toBeLessThan(0.02);
    expect(e.ucaUzaklikGun).toBeLessThan(0.1);
  });

  it('yarım sinodik ay sonra dolunay döndürür', () => {
    const yariAyMs = 29.530588853 / 2 * 86_400_000;
    const e = ayEvresi(new Date(Date.UTC(2000, 0, 6, 18, 14) + yariAyMs));
    expect(e.id).toBe('dolunay');
    expect(e.aydinlanma).toBeGreaterThan(0.98);
    expect(e.ucaUzaklikGun).toBeLessThan(0.1);
  });

  it('ilk dördünde aydınlanma yarıya yakındır', () => {
    const ceyrekMs = 29.530588853 / 4 * 86_400_000;
    const e = ayEvresi(new Date(Date.UTC(2000, 0, 6, 18, 14) + ceyrekMs));
    expect(e.id).toBe('ilk-dordun');
    expect(e.aydinlanma).toBeGreaterThan(0.45);
    expect(e.aydinlanma).toBeLessThan(0.55);
  });

  it('faz her zaman 0-1 aralığında kalır', () => {
    for (const gun of [-4000, -1, 0, 1, 5000]) {
      const e = ayEvresi(new Date(Date.UTC(2000, 0, 6) + gun * 86_400_000));
      expect(e.faz).toBeGreaterThanOrEqual(0);
      expect(e.faz).toBeLessThan(1);
    }
  });
});
