import { describe, expect, it } from 'vitest';
import { baslikBicimi } from '../src/lib/metin';

/**
 * Başlıklar başlık biçiminde yazılır. Bu test kaynaktaki sabit metinleri
 * denetler; veriden gelen başlıklar zaten render sırasında `baslikBicimi()`
 * üzerinden geçiyor.
 *
 * Şema bileşenleri (`src/components/svg`) hariç tutulur: oradaki `baslik`
 * alanı düğüm adımının cümlesidir, başlık değildir.
 */
const kaynaklar = import.meta.glob('../src/**/*.astro', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const dosyalar = Object.entries(kaynaklar).filter(([yol]) => !yol.includes('/svg/'));

/**
 * Sabit metinli başlıklar ve etiketler.
 *
 * Başlıklara ek olarak denetim ve tablo etiketleri de taranıyor: düğme, açılır
 * bölüm başlığı (`<summary>`) ve tablo sütun/satır başlığı (`<th>`). Bunlar düz
 * metin değil, etiket; hepsi başlık biçiminde yazılır. İfade (`{...}`) veya iç
 * öğe içerenler atlanır — onların metni veriden gelir ve render sırasında
 * `baslikBicimi()` üzerinden geçer.
 */
function sabitBasliklar(kaynak: string): string[] {
  const bulunan: string[] = [];
  for (const etiket of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'summary', 'th']) {
    const kalip = new RegExp(`<(${etiket})\\b[^>]*>([^<{]*?)</\\1>`, 'gs');
    for (const m of kaynak.matchAll(kalip)) {
      const metin = m[2]!.trim();
      if (metin) bulunan.push(metin);
    }
  }
  for (const m of kaynak.matchAll(/\bbaslik="([^"{}]+)"/g)) bulunan.push(m[1]!);
  return bulunan;
}

describe('başlık yazımı', () => {
  it('taranacak dosya bulundu', () => {
    expect(dosyalar.length).toBeGreaterThan(20);
  });

  it('kaynaktaki bütün sabit başlık ve etiketler başlık biçiminde', () => {
    const bozuk: string[] = [];
    for (const [yol, kaynak] of dosyalar) {
      for (const metin of sabitBasliklar(kaynak)) {
        if (baslikBicimi(metin) !== metin) {
          bozuk.push(`${yol}: "${metin}" → "${baslikBicimi(metin)}"`);
        }
      }
    }
    expect(bozuk, `\n${bozuk.join('\n')}`).toEqual([]);
  });
});
