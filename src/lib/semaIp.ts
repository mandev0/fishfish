/**
 * Düğüm şemalarının çizim yardımcıları — "ip geometrisi".
 *
 * Düğüm çizimini anlaşılır kılan şey renk değil, **hangi ipin hangisinin
 * üstünden geçtiği**. Elle çizilen `q`/`c` eğrileriyle bu bilgi kayboluyordu:
 * iki çizgi kesişiyor ama hangisi önde belli olmuyordu.
 *
 * Buradaki fonksiyonlar saf geometridir, SVG `d` dizesi üretir ve her parçanın
 * **önde mi arkada mı** olduğunu söyler. Çizim sırası bu bilgiye göre kurulur:
 * arkadakiler önce, öndekiler `kılıf` (zemin renginde kalın alt çizgi) ile
 * üstüne basılır. Dış bir kütüphane yok — çıktı derleme zamanında sabitlenmiş
 * satır içi SVG'dir, çalışma anında JavaScript çalışmaz.
 */

/** Ondalıkları kısalt — SVG yolu okunur kalsın, çıktı yeniden üretilebilir olsun. */
function y(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export interface SarimSecenek {
  /** Sarımın başladığı nokta (eksen üzerinde). */
  x: number;
  y: number;
  /** Tur sayısı. */
  adet: number;
  /** Bir turun eksen boyunca ilerlemesi. */
  adim: number;
  /** Sarımın ekseni sardığı yarıçap — ipin "kalınlığı" gibi okunur. */
  yaricap?: number;
  /** Eksenin yatayla açısı (derece). Dikey bir pipoya sarmak için 90 ver. */
  aci?: number;
  /** Sarım yönü: 1 saat yönü, -1 tersi. */
  yon?: 1 | -1;
}

export interface IpParcasi {
  d: string;
  /** true ise eksenin önünden geçiyor; çizim sırasında en üste gelir. */
  on: boolean;
}

/**
 * Bir ipi bir eksenin (ana misina, iğne piposu, lider) etrafına sarar.
 *
 * Helis (yay) bir eksen etrafında dönen üç boyutlu bir eğridir; ekrana
 * düşürünce ön yarısı görünür, arka yarısı eksenin arkasında kalır. Turu
 * ikiye bölüp iki ayrı parça döndürüyoruz ki çağıran taraf arka yarımları
 * önce, ön yarımları sonra çizebilsin.
 */
export function sarim(s: SarimSecenek): IpParcasi[] {
  const { x, y: cy, adet, adim } = s;
  const r = s.yaricap ?? 8;
  const aci = ((s.aci ?? 0) * Math.PI) / 180;
  const yon = s.yon ?? 1;
  const cos = Math.cos(aci);
  const sin = Math.sin(aci);
  const ORNEK = 8; // yarım tur başına örnek sayısı

  // Eksen-yerel (u = eksen boyunca, v = eksene dik) koordinattan sayfa koordinatına.
  const nokta = (u: number, v: number) => [x + u * cos - v * sin, cy + u * sin + v * cos];

  const yarim = (t0: number, i: number): string => {
    const parcalar: string[] = [];
    for (let k = 0; k <= ORNEK; k++) {
      const t = t0 + (Math.PI * k) / ORNEK;
      const u = adim * (i + (t - Math.PI / 2) / (2 * Math.PI));
      const v = r * Math.sin(t) * yon;
      const [px, py] = nokta(u, v);
      parcalar.push(`${k === 0 ? 'M' : 'L'}${y(px!)} ${y(py!)}`);
    }
    return parcalar.join(' ');
  };

  const parcalar: IpParcasi[] = [];
  for (let i = 0; i < adet; i++) {
    // t ∈ [π/2, 3π/2] eksenin arkası, t ∈ [-π/2, π/2] önü.
    parcalar.push({ d: yarim(Math.PI / 2, i), on: false });
    parcalar.push({ d: yarim(-Math.PI / 2, i), on: true });
  }
  return parcalar;
}

/** Sarımın eksen boyunca kapladığı uzunluk — etiketi hizalamak için. */
export function sarimBoyu(adet: number, adim: number): number {
  return adet * adim;
}

export interface OkSecenek {
  /** Yayın eğriliği: 0 düz çizgi, pozitif sola, negatif sağa büker. */
  kavis?: number;
  /** Ok ucunun boyu. */
  uc?: number;
}

export interface Ok {
  /** Ok gövdesi — `hareket` sınıfıyla çizilir. */
  govde: string;
  /** Ok ucu üçgeni — `polygon points` değeri. */
  uc: string;
}

/**
 * Yön oku: nereye çekileceğini, ilmeğin nereden geçeceğini gösterir.
 * Ucu ayrı döner çünkü gövde kesik çizgi, uç dolu üçgendir.
 */
export function ok(x1: number, y1: number, x2: number, y2: number, s: OkSecenek = {}): Ok {
  const kavis = s.kavis ?? 0;
  const ucBoyu = s.uc ?? 9;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const boy = Math.hypot(dx, dy) || 1;
  // Kontrol noktası, orta noktadan dik yönde kavis kadar kaydırılır.
  const kx = (x1 + x2) / 2 - (dy / boy) * kavis;
  const ky = (y1 + y2) / 2 + (dx / boy) * kavis;

  // Ucun yönü: kontrol noktasından bitiş noktasına doğru teğet.
  const tx = x2 - kx;
  const ty = y2 - ky;
  const t = Math.hypot(tx, ty) || 1;
  const ux = tx / t;
  const uy = ty / t;
  const gx = x2 - ux * ucBoyu;
  const gy = y2 - uy * ucBoyu;
  const w = ucBoyu * 0.42;

  return {
    govde: `M${y(x1)} ${y(y1)} Q${y(kx)} ${y(ky)} ${y(gx)} ${y(gy)}`,
    uc: [
      `${y(x2)},${y(y2)}`,
      `${y(gx - uy * w)},${y(gy + ux * w)}`,
      `${y(gx + uy * w)},${y(gy - ux * w)}`,
    ].join(' '),
  };
}

/**
 * Ölçü çizgisi (`3-5 cm`, `15 cm uç`) — iki uçta tırnak, ortada boşluk yok;
 * metin çağıran tarafta basılır.
 */
export function olcu(x1: number, x2: number, cy: number, tirnak = 5): string {
  return [
    `M${y(x1)} ${y(cy)} L${y(x2)} ${y(cy)}`,
    `M${y(x1)} ${y(cy - tirnak)} L${y(x1)} ${y(cy + tirnak)}`,
    `M${y(x2)} ${y(cy - tirnak)} L${y(x2)} ${y(cy + tirnak)}`,
  ].join(' ');
}

/**
 * İlmek (bight): ipin geri katlandığı yuvarlak dönüş.
 * `x` dönüşün en uç noktası, iki kol `y1` ve `y2` yüksekliğinde geri gider.
 */
export function ilmek(x: number, y1: number, y2: number, uzunluk: number): string {
  const r = Math.abs(y2 - y1) / 2;
  return `M${y(x + uzunluk)} ${y(y1)} L${y(x + r)} ${y(y1)} A${y(r)} ${y(r)} 0 0 0 ${y(x + r)} ${y(y2)} L${y(x + uzunluk)} ${y(y2)}`;
}
