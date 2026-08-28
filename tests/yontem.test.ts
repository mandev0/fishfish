import { describe, expect, it } from 'vitest';
import methods from '../src/data/methods.json';
import rigs from '../src/data/rigs.json';
import spots from '../src/data/spots.json';
import { IKONLAR } from '../src/lib/ikonlar';
import { SU_TURU } from '../src/lib/season';

const yontemId = new Set(methods.map((m) => m.id));

describe('yöntemler', () => {
  it('her takım gerçek bir yönteme bağlı', () => {
    for (const r of rigs) {
      expect(yontemId.has(r.yontem), `${r.id}: bilinmeyen yöntem "${r.yontem}"`).toBe(true);
    }
  });

  it('her noktanın yöntemleri gerçek', () => {
    for (const s of spots) {
      for (const y of s.yontemler) {
        expect(yontemId.has(y), `${s.id}: bilinmeyen yöntem "${y}"`).toBe(true);
      }
    }
  });

  it('bir noktada ancak o suda uygulanan yöntem listelenir', () => {
    // Tatlı su noktasına "egi", deniz noktasına "feeder" yazılması sessiz bir hata olurdu.
    for (const s of spots) {
      const suSinifi = SU_TURU[s.su] === 'deniz' ? 'deniz' : 'tatli';
      for (const y of s.yontemler) {
        const yontem = methods.find((m) => m.id === y)!;
        expect(
          yontem.sular.includes(suSinifi),
          `${s.id} (${suSinifi}) için "${y}" uygun değil`,
        ).toBe(true);
      }
    }
  });

  it('her yöntemin simgesi ikonlar.ts içinde tanımlı', () => {
    for (const m of methods) {
      expect(IKONLAR[m.ikon], `${m.id}: "${m.ikon}" simgesi yok`).toBeTruthy();
    }
  });

  it('her yöntem en az bir noktada uygulanabiliyor', () => {
    for (const m of methods) {
      const sayi = spots.filter((s) => s.yontemler.includes(m.id)).length;
      expect(sayi, `${m.id} hiçbir noktada yok`).toBeGreaterThan(0);
    }
  });

  it('tekneye özgü yöntem yok', () => {
    // Site kıyı rehberi; sürütme ve tekne jigi kapsam dışı.
    for (const m of methods) {
      const metin = `${m.ad} ${m.nedir} ${m.kimeUygun}`.toLocaleLowerCase('tr');
      expect(metin.includes('tekneden'), `${m.id} tekneden avı anlatıyor`).toBe(false);
    }
  });
});

describe('tatlı su noktaları', () => {
  const tatli = spots.filter((s) => SU_TURU[s.su] !== 'deniz');

  it('tatlı su noktaları var', () => {
    expect(tatli.length).toBeGreaterThan(0);
  });

  it('deniz modeli olmadığı işaretli', () => {
    for (const s of tatli) {
      expect(s.denizVerisiZayif, `${s.id}: denizVerisiZayif işaretlenmemiş`).toBe(true);
    }
  });

  it('mevzuat notu kaynağıyla birlikte yazılmış', () => {
    for (const s of tatli) {
      expect(s.mevzuat, `${s.id}: mevzuat notu yok`).toBeTruthy();
      expect(s.mevzuat!.kaynak.length, `${s.id}: kaynak boş`).toBeGreaterThan(0);
      expect(s.mevzuat!.kontrolTarihi, `${s.id}: kontrol tarihi boş`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
