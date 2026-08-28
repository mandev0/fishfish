import { describe, expect, it } from 'vitest';
import { mesafeKm, mesafeMetni } from '../src/lib/mesafe';

describe('mesafe', () => {
  it('aynı noktanın kendine uzaklığı sıfırdır', () => {
    expect(mesafeKm(41, 29, 41, 29)).toBe(0);
  });

  it('bilinen iki nokta arasını makul hesaplar', () => {
    // Moda Burnu ↔ Rumeli Kavağı: kuş uçuşu ~25 km.
    const km = mesafeKm(40.9755, 29.0265, 41.1873, 29.0783);
    expect(km).toBeGreaterThan(22);
    expect(km).toBeLessThan(28);
  });

  it('simetriktir', () => {
    const a = mesafeKm(40.99, 29.02, 41.19, 29.08);
    const b = mesafeKm(41.19, 29.08, 40.99, 29.02);
    expect(a).toBeCloseTo(b, 9);
  });

  it('bir kilometrenin altını metreyle yazar', () => {
    expect(mesafeMetni(0.42)).toBe('420 m');
    expect(mesafeMetni(0.999)).toBe('999 m');
  });

  it('Türkçe ondalık ayracı kullanır', () => {
    expect(mesafeMetni(1.34)).toBe('1,3 km');
    expect(mesafeMetni(9.94)).toBe('9,9 km');
  });

  it('uzak mesafelerde ondalık göstermez', () => {
    expect(mesafeMetni(12.4)).toBe('12 km');
    expect(mesafeMetni(260.5)).toBe('261 km');
  });
});
