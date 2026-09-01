import { describe, expect, it } from 'vitest';
import methods from '../src/data/methods.json';
import rigs from '../src/data/rigs.json';
import spots from '../src/data/spots.json';
import { IKONLAR } from '../src/lib/ikonlar';
import { SU_TURU } from '../src/lib/season';
import { turYontemleri, yontemAyrismalari } from '../src/lib/yontem';

const turDosyalari = import.meta.glob('../src/data/species/*.json', { eager: true }) as
  Record<string, { default: { takimlar: string[] } }>;
const species = Object.entries(turDosyalari).map(([yol, m]) => ({
  id: yol.split('/').pop()!.replace('.json', ''),
  takimlar: m.default.takimlar,
}));

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

describe('tür ↔ yöntem eşlemesi', () => {
  const harita = turYontemleri(species, rigs, methods);

  it('her tür en az bir yönteme bağlanır', () => {
    for (const t of species) {
      expect(harita[t.id]?.length, `${t.id}: hiçbir yönteme bağlanmadı`).toBeGreaterThan(0);
    }
  });

  it('yalnızca gerçek yöntem kimlikleri döner', () => {
    for (const [tur, liste] of Object.entries(harita)) {
      for (const y of liste) expect(yontemId.has(y), `${tur}: bilinmeyen yöntem "${y}"`).toBe(true);
    }
  });

  it('iki kaynağın birleşimini alır — hiçbiri tek başına yeterli değil', () => {
    // Levrek somut örnek: takımlarından `dip-yemli`, yöntem kaydından `surf` gelir.
    // Tek kaynağa güvenen bir filtre bu türü ilgili yöntemde göstermezdi.
    expect(harita['levrek']).toContain('dip-yemli');
    expect(harita['levrek']).toContain('surf');
  });

  it('çıktı yöntem sırasını korur — filtre kutusu zorluk sırasında kalsın', () => {
    const sira = methods.map((m) => m.id);
    for (const liste of Object.values(harita)) {
      const indeksler = liste.map((y) => sira.indexOf(y));
      expect([...indeksler].sort((a, b) => a - b)).toEqual(indeksler);
    }
  });

  it('ayrışma raporu yalnızca gerçekten ayrışanları listeler', () => {
    const ayrisan = yontemAyrismalari(species, rigs, methods);
    for (const { tur, takimdanEksik, yontemdenEksik } of ayrisan) {
      expect(takimdanEksik.length + yontemdenEksik.length, `${tur} boş yere raporlandı`).toBeGreaterThan(0);
    }
    // Tam örtüşen bir tür raporda olmamalı.
    const uyumlu = species.find((t) => !ayrisan.some((a) => a.tur === t.id));
    expect(uyumlu, 'hiçbir tür örtüşmüyor — eşleme kurgusu bozulmuş olabilir').toBeDefined();
  });
});
