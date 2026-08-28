import { describe, expect, it } from 'vitest';
import { baslikBicimi, cumleBicimi, sayiMetni } from '../src/lib/metin';

describe('başlık biçimi', () => {
  it('her kelimenin ilk harfini büyütür', () => {
    expect(baslikBicimi('çok kolay')).toBe('Çok Kolay');
    expect(baslikBicimi('gece avı')).toBe('Gece Avı');
    expect(baslikBicimi('orta yoğun')).toBe('Orta Yoğun');
    expect(baslikBicimi('sezonun zirvesi')).toBe('Sezonun Zirvesi');
  });

  it('Türkçe i/ı ayrımını korur', () => {
    // i → İ (noktalı), ı → I (noktasız)
    expect(baslikBicimi('iyi')).toBe('İyi');
    expect(baslikBicimi('ılık su')).toBe('Ilık Su');
    expect(baslikBicimi('işık')).toBe('İşık');
  });

  it('rakamla başlayan etiketleri bozmaz', () => {
    expect(baslikBicimi('1 uyarı')).toBe('1 Uyarı');
    expect(baslikBicimi('41 nokta')).toBe('41 Nokta');
  });

  it('zaten büyük harfli metni değiştirmez', () => {
    expect(baslikBicimi('Uzman İşi')).toBe('Uzman İşi');
    expect(baslikBicimi('LRF')).toBe('LRF');
  });

  it('bağlaçları ve soru ekini küçük bırakır', () => {
    // TDK: başlıklarda ve/ile/da/de bağlaçları ile mı/mi soru eki küçük yazılır.
    expect(baslikBicimi('yem ve sahte yem')).toBe('Yem ve Sahte Yem');
    expect(baslikBicimi('kurallar ve boy limitleri')).toBe('Kurallar ve Boy Limitleri');
    expect(baslikBicimi('çapari ile başla')).toBe('Çapari ile Başla');
    expect(baslikBicimi('aktif mi, pasif mi?')).toBe('Aktif mi, Pasif mi?');
  });

  it('bağlaç başta gelirse büyütür', () => {
    // Başlık her zaman büyük harfle başlar.
    expect(baslikBicimi('ve sonrası')).toBe('Ve Sonrası');
  });

  it('ayraçlı etiketleri olduğu gibi bırakır', () => {
    expect(baslikBicimi('Boğaz · Marmara')).toBe('Boğaz · Marmara');
  });

  it('boş metinde patlamaz', () => {
    expect(baslikBicimi('')).toBe('');
    expect(cumleBicimi('')).toBe('');
  });
});

describe('cümle biçimi', () => {
  it('yalnızca ilk harfi büyütür', () => {
    expect(cumleBicimi('park yeri bulmak kolay')).toBe('Park yeri bulmak kolay');
    expect(cumleBicimi('ılık suda av')).toBe('Ilık suda av');
  });
});

describe('sayı biçimi', () => {
  it('Türkçe ondalık ayracıyla yazar', () => {
    expect(sayiMetni(25.64)).toBe('25,6');
    expect(sayiMetni(0.92, 2)).toBe('0,92');
    expect(sayiMetni(-1.25)).toBe('-1,3');
  });

  it('tam sayıda da ayracı korur', () => {
    expect(sayiMetni(3)).toBe('3,0');
    expect(sayiMetni(3, 0)).toBe('3');
  });
});
