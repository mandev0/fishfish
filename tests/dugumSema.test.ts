import { describe, expect, it } from 'vitest';
import dugumler from '../src/data/knots.json';
import { sarim } from '../src/lib/semaIp';

/**
 * Düğüm şemalarının viewBox denetimi.
 *
 * Şemayı tarayıcıda ölçmek gerekiyor ama `getBBox` grup dönüşümünü hesaba
 * katmadığı için yanlış sonuç veriyor. Bunun yerine kaynağı okuyup her adımın
 * içeriğini kendimiz sınırlıyoruz: etiketler ve parçalar 320 x `boy`
 * çerçevesinin dışına çıkmamalı. Etiket genişliği 11 piksellik yazıdan
 * karakter başına ~6 piksel sayılarak kestiriliyor — kesin değil, ama taşan
 * bir etiketi yakalamaya fazlasıyla yeter.
 */
const EN = 320;
const KARAKTER = 6;

const kaynaklar = import.meta.glob('../src/components/svg/knots/*.astro', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const semalar = Object.entries(kaynaklar)
  .filter(([yol]) => !yol.split('/').pop()!.startsWith('_'))
  .map(([yol, kaynak]) => ({ ad: yol.split('/').pop()!, kaynak }));

const knotDiagram = import.meta.glob('../src/components/svg/KnotDiagram.astro', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

/** `sayi={12}` veya `sayi="12"` biçimindeki bir sayısal özniteliği okur. */
function sayi(oz: string, ad: string, varsayilan?: number): number {
  const m = oz.match(new RegExp(`\\b${ad}=(?:\\{(-?[\\d.]+)\\}|"(-?[\\d.]+)")`));
  const v = m?.[1] ?? m?.[2];
  if (v === undefined) {
    if (varsayilan === undefined) throw new Error(`${ad} eksik: ${oz}`);
    return varsayilan;
  }
  return Number(v);
}

interface Kutu { x1: number; y1: number; x2: number; y2: number; ne: string }

/** Bir adımın içindeki bütün parçaların sayfa koordinatındaki sınırları. */
function parcalar(govde: string): Kutu[] {
  const kutular: Kutu[] = [];
  const kutu = (ne: string, xs: number[], ys: number[]) =>
    kutular.push({ ne, x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) });

  // Etiketler: yazı yönüne göre sola/sağa/ortaya yayılır.
  for (const m of govde.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
    const oz = m[1]!;
    const metin = m[2]!.trim();
    const x = sayi(oz, 'x', 0);
    const y = sayi(oz, 'y', 0);
    const hiza = oz.match(/text-anchor="(\w+)"/)?.[1] ?? 'start';
    const g = metin.length * KARAKTER;
    const x1 = hiza === 'end' ? x - g : hiza === 'middle' ? x - g / 2 : x;
    // 11 piksellik yazının tabanı `y`; üstü yaklaşık 9 piksel yukarıda.
    kutu(`etiket "${metin}"`, [x1, x1 + g], [y - 9, y + 2]);
  }

  // Elle yazılan yollar.
  for (const m of govde.matchAll(/\bd="([^"]+)"/g)) {
    const s = m[1]!.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    const xs: number[] = [];
    const ys: number[] = [];
    for (let k = 0; k + 1 < s.length; k += 2) { xs.push(s[k]!); ys.push(s[k + 1]!); }
    if (xs.length) kutu('yol', xs, ys);
  }

  // Çemberler ve elipsler.
  for (const m of govde.matchAll(/<(circle|ellipse)\b([^>]*)>/g)) {
    const oz = m[2]!;
    const cx = sayi(oz, 'cx', 0);
    const cy = sayi(oz, 'cy', 0);
    const rx = m[1] === 'circle' ? sayi(oz, 'r') : sayi(oz, 'rx');
    const ry = m[1] === 'circle' ? sayi(oz, 'r') : sayi(oz, 'ry');
    kutu(m[1]!, [cx - rx, cx + rx], [cy - ry, cy + ry]);
  }

  // Halka.
  for (const m of govde.matchAll(/<Halka\b([^/>]*)\/>/g)) {
    const oz = m[1]!;
    const cx = sayi(oz, 'cx');
    const cy = sayi(oz, 'cy');
    const r = sayi(oz, 'r', 15);
    kutu('halka', [cx - r, cx + r], [cy - r, cy + r]);
  }

  // İğne: göz merkezine göre yerel sınırları x [-10, 42], y [-10, 92].
  for (const m of govde.matchAll(/<Igne\b([^/>]*)\/>/g)) {
    const oz = m[1]!;
    const x = sayi(oz, 'x');
    const y = sayi(oz, 'y');
    const o = sayi(oz, 'olcek', 1);
    const d = (sayi(oz, 'donme', 0) * Math.PI) / 180;
    const kose: [number, number][] = [[-10, -10], [42, -10], [42, 92], [-10, 92]];
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [lx, ly] of kose) {
      xs.push(x + o * (lx * Math.cos(d) - ly * Math.sin(d)));
      ys.push(y + o * (lx * Math.sin(d) + ly * Math.cos(d)));
    }
    kutu('iğne', xs, ys);
  }

  // Sıkılmış düğüm gövdesi.
  for (const m of govde.matchAll(/<Sikilmis\b([^/>]*)\/>/g)) {
    const oz = m[1]!;
    const x = sayi(oz, 'x');
    const y = sayi(oz, 'y');
    const en = sayi(oz, 'en', 54) / 2;
    const boy = sayi(oz, 'boy', 22) / 2;
    const d = (sayi(oz, 'donme', 0) * Math.PI) / 180;
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [lx, ly] of [[-en, -boy], [en, -boy], [en, boy], [-en, boy]] as [number, number][]) {
      xs.push(x + lx * Math.cos(d) - ly * Math.sin(d));
      ys.push(y + lx * Math.sin(d) + ly * Math.cos(d));
    }
    kutu('sıkılmış düğüm', xs, ys);
  }

  // Sarım ve burgu: geometriyi kütüphaneden hesapla.
  for (const m of govde.matchAll(/<(Sarim|Burgu)\b([^>]*?)(?:\/)?>/g)) {
    const oz = m[2]!;
    const s = {
      x: sayi(oz, 'x'), y: sayi(oz, 'y'),
      adet: sayi(oz, 'adet'), adim: sayi(oz, 'adim'),
      yaricap: sayi(oz, 'yaricap', 8), aci: sayi(oz, 'aci', 0),
    };
    const kayma = m[1] === 'Burgu' ? s.adim / 2 : 0;
    const noktalar = [
      ...sarim(s),
      ...(kayma
        ? sarim({ ...s, x: s.x + kayma * Math.cos((s.aci * Math.PI) / 180), y: s.y + kayma * Math.sin((s.aci * Math.PI) / 180) })
        : []),
    ];
    const xs: number[] = [];
    const ys: number[] = [];
    for (const p of noktalar) {
      const sayilar = p.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      for (let k = 0; k + 1 < sayilar.length; k += 2) { xs.push(sayilar[k]!); ys.push(sayilar[k + 1]!); }
    }
    kutu(m[1]!.toLowerCase(), xs, ys);
  }

  return kutular;
}

describe('düğüm şemaları', () => {
  it('her düğümün şeması var', () => {
    const kayitli = Object.values(knotDiagram)[0]!;
    const anahtarlar = [...kayitli.matchAll(/^\s*'?([a-z-]+)'?:\s*[A-Z]\w*,$/gm)].map((m) => m[1]);
    for (const d of dugumler) {
      expect(anahtarlar, `${d.id} için şema bileşeni bağlanmamış`).toContain(d.id);
      const anahtarBloku = kayitli.slice(kayitli.indexOf('const ANAHTARLAR'));
      expect(anahtarBloku, `${d.id} renk anahtarı tanımsız`).toMatch(new RegExp(`'?${d.id}'?:\\s*\\[`));
    }
    expect(semalar).toHaveLength(dugumler.length);
  });

  it('adımlar 1’den başlar ve birer birer artar', () => {
    for (const { ad, kaynak } of semalar) {
      const nolar = [...kaynak.matchAll(/<Adim no=\{(\d+)\}/g)].map((m) => Number(m[1]));
      expect(nolar.length, `${ad} çizimsiz`).toBeGreaterThanOrEqual(4);
      expect(nolar, ad).toEqual(nolar.map((_, i) => i + 1));
    }
  });

  it('hiçbir etiket veya parça viewBox dışına taşmıyor', () => {
    const tasan: string[] = [];
    for (const { ad, kaynak } of semalar) {
      const bloklar = kaynak.split(/<Adim\b/).slice(1);
      bloklar.forEach((blok, i) => {
        const bas = blok.slice(0, blok.indexOf('>'));
        const boy = sayi(bas, 'boy', 170);
        for (const k of parcalar(blok.slice(blok.indexOf('>')))) {
          if (k.x1 < 0 || k.x2 > EN || k.y1 < 0 || k.y2 > boy) {
            tasan.push(`${ad} adım ${i + 1}: ${k.ne} → x[${k.x1.toFixed(0)}, ${k.x2.toFixed(0)}] y[${k.y1.toFixed(0)}, ${k.y2.toFixed(0)}] / 320x${boy}`);
          }
        }
      });
    }
    expect(tasan, `\n${tasan.join('\n')}`).toEqual([]);
  });
});
