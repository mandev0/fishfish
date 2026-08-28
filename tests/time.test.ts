import { describe, expect, it } from 'vitest';
import { gecenSureMetni, isoyuCozumle, istanbulAy, istanbulSaat, ofsetMetni } from '../src/lib/time';

describe('zaman yardımcıları', () => {
  it('utc ofsetini metne çevirir', () => {
    expect(ofsetMetni(10800)).toBe('+03:00');
    expect(ofsetMetni(0)).toBe('+00:00');
    expect(ofsetMetni(-18000)).toBe('-05:00');
  });

  it('Open-Meteo yerel damgasını mutlak ana çevirir', () => {
    const d = isoyuCozumle('2026-08-28T14:00', 10800);
    expect(d.toISOString()).toBe('2026-08-28T11:00:00.000Z');
  });

  it('saati makinenin saat diliminden bağımsız olarak İstanbul’a göre verir', () => {
    // 21:30 UTC = ertesi gün 00:30 İstanbul
    const d = new Date('2026-08-28T21:30:00Z');
    expect(istanbulSaat(d)).toBe(0);
    expect(istanbulAy(d)).toBe(8);
  });

  it('gece yarısını 24 değil 0 olarak döndürür', () => {
    expect(istanbulSaat(new Date('2026-01-01T00:00:00+03:00'))).toBe(0);
  });

  it('geçen süreyi insan okur biçimde yazar', () => {
    const dk = 60000;
    expect(gecenSureMetni(30_000)).toBe('az önce');
    expect(gecenSureMetni(dk)).toBe('1 dakika önce');
    expect(gecenSureMetni(59 * dk)).toBe('59 dakika önce');
    expect(gecenSureMetni(60 * dk)).toBe('1 saat önce');
    expect(gecenSureMetni(3 * 60 * dk + 20 * dk)).toBe('3 saat önce');
    expect(gecenSureMetni(23 * 60 * dk)).toBe('23 saat önce');
    expect(gecenSureMetni(25 * 60 * dk)).toBe('1 gün önce');
  });
});
