/**
 * Sezgisel "bugün tutulur mu?" skoru.
 *
 * Girdi: tür profili + o an/o noktadaki hava & deniz koşulları.
 * Çıktı: 0-100 skor + skoru oluşturan her faktörün Türkçe gerekçesi.
 *
 * Skor bir tahmindir, garanti değildir. Bu yüzden her faktör ayrı ayrı
 * gösterilir; kullanıcı hangi bileşene ne kadar güveneceğine kendi karar verir.
 */

import { sayiMetni } from './metin';
import {
  AGIRLIKLAR, BASINC_EGRISI, DALGA_EGRISI, KOSUL_TABANI,
  MEVSIM_USSU, RUZGAR_EGRISI, SEVIYE_ESIKLERI, SEVIYE_METNI, TEHLIKE,
} from './score.config';
import { ayEvresi } from './moon';
import { ayIndeksi, saatDilimi, SAAT_ADLARI } from './season';
import { beaufortAdi, kiyiIliskisi, ruzgar, type RuzgarAdi } from './wind';
import { istanbulAy, istanbulSaat } from './time';

export interface TurProfili {
  id: string;
  ad: string;
  aylar: number[];
  gece: boolean;
  suSicakligi: { min: number; ideal: [number, number]; max: number };
  aktifSaatler: string[];
  ruzgarTercihi: RuzgarAdi[];
  ruzgarKacinilan: RuzgarAdi[];
}

export interface Kosullar {
  tarih: Date;
  suSicakligi?: number | null;
  dalga?: number | null;
  /** Saniye. Kısa periyot = çırpıntı, uzun periyot = ölü dalga. */
  dalgaPeriyodu?: number | null;
  ruzgarHizi?: number | null;
  ruzgarYonu?: number | null;
  ruzgarHamlesi?: number | null;
  /** Son 6 saatteki basınç değişimi, hPa. */
  basincEgilimi?: number | null;
  bulut?: number | null;
  yagis?: number | null;
  gunDogumu?: Date | null;
  gunBatimi?: Date | null;
  /** Noktanın denize baktığı yön (derece). Verilirse rüzgâr kıyıya göre yorumlanır. */
  kiyiYonu?: number | null;
}

export interface SkorFaktoru {
  id: string;
  ad: string;
  puan: number;
  agirlik: number;
  gerekce: string;
  veriYok?: boolean;
}

export type Seviye = 'cokIyi' | 'iyi' | 'orta' | 'dusuk';

export interface SkorSonucu {
  skor: number;
  seviye: Seviye;
  seviyeMetni: string;
  mevsimPuani: number;
  faktorler: SkorFaktoru[];
  uyarilar: string[];
  tehlike: boolean;
  /** Hiç canlı veri gelmediyse true — skor sadece mevsime dayanır. */
  sadeceMevsim: boolean;
}

/** Eğri tablosundan doğrusal ara değer okur. */
export function egriden(egri: [number, number][], x: number): number {
  if (x <= egri[0]![0]) return egri[0]![1];
  const son = egri[egri.length - 1]!;
  if (x >= son[0]) return son[1];
  for (let i = 0; i < egri.length - 1; i++) {
    const [x1, y1] = egri[i]!;
    const [x2, y2] = egri[i + 1]!;
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return son[1];
}

function sicaklikPuani(t: number, aralik: TurProfili['suSicakligi']): number {
  const [idealAlt, idealUst] = aralik.ideal;
  if (t >= idealAlt && t <= idealUst) return 1;
  if (t < idealAlt) {
    if (t >= aralik.min) return 0.5 + 0.5 * ((t - aralik.min) / Math.max(0.1, idealAlt - aralik.min));
    return Math.max(0, 0.5 - (aralik.min - t) / 6);
  }
  if (t <= aralik.max) return 0.5 + 0.5 * ((aralik.max - t) / Math.max(0.1, aralik.max - idealUst));
  return Math.max(0, 0.5 - (t - aralik.max) / 6);
}

const KOMSU_DILIM: Record<string, string[]> = {
  gece: ['safak', 'aksam'],
  safak: ['gece', 'sabah'],
  sabah: ['safak', 'oglen'],
  oglen: ['sabah', 'ikindi'],
  ikindi: ['oglen', 'aksam'],
  aksam: ['ikindi', 'gece'],
};

function dakikaFarki(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

export function skorHesapla(tur: TurProfili, kosul: Kosullar): SkorSonucu {
  const faktorler: SkorFaktoru[] = [];
  const uyarilar: string[] = [];
  let tehlike = false;

  const ay = ayIndeksi(istanbulAy(kosul.tarih));
  const mevsimHam = tur.aylar[ay] ?? 0;
  const mevsimPuani = mevsimHam / 5;

  // --- Su sıcaklığı ---------------------------------------------------
  if (typeof kosul.suSicakligi === 'number') {
    const p = sicaklikPuani(kosul.suSicakligi, tur.suSicakligi);
    const [a, b] = tur.suSicakligi.ideal;
    faktorler.push({
      id: 'suSicakligi',
      ad: 'Su sıcaklığı',
      puan: p,
      agirlik: AGIRLIKLAR.suSicakligi,
      gerekce: `Deniz ${sayiMetni(kosul.suSicakligi)}°C. ${tur.ad} için ideal aralık ${a}-${b}°C.`,
    });
  } else {
    faktorler.push({
      id: 'suSicakligi', ad: 'Su sıcaklığı', puan: 0, agirlik: 0,
      veriYok: true, gerekce: 'Su sıcaklığı verisi alınamadı.',
    });
  }

  // --- Rüzgâr şiddeti -------------------------------------------------
  if (typeof kosul.ruzgarHizi === 'number') {
    let p = egriden(RUZGAR_EGRISI, kosul.ruzgarHizi);
    let not = `${Math.round(kosul.ruzgarHizi)} km/sa — ${beaufortAdi(kosul.ruzgarHizi)}.`;

    if (typeof kosul.ruzgarYonu === 'number' && typeof kosul.kiyiYonu === 'number') {
      const iliski = kiyiIliskisi(kosul.ruzgarYonu, kosul.kiyiYonu);
      if (iliski === 'karadan') {
        p = Math.min(1, p * 1.1);
        not += ' Karadan estiği için su düz, atış rahat.';
      } else if (iliski === 'denizden' && kosul.ruzgarHizi > 22) {
        p *= 0.75;
        not += ' Denizden estiği için kıyıda dalga ve atış zorluğu var.';
      }
    }

    if (kosul.ruzgarHizi >= TEHLIKE.ruzgarKmh) {
      tehlike = true;
      uyarilar.push(`Rüzgâr ${Math.round(kosul.ruzgarHizi)} km/sa. Mendirek ve kayalıklara çıkma.`);
    }
    if (typeof kosul.ruzgarHamlesi === 'number' && kosul.ruzgarHamlesi >= TEHLIKE.hamleKmh) {
      tehlike = true;
      uyarilar.push(`Ani hamleler ${Math.round(kosul.ruzgarHamlesi)} km/sa'e çıkıyor.`);
    }

    faktorler.push({
      id: 'ruzgarSiddeti', ad: 'Rüzgâr şiddeti', puan: p,
      agirlik: AGIRLIKLAR.ruzgarSiddeti, gerekce: not,
    });
  } else {
    faktorler.push({
      id: 'ruzgarSiddeti', ad: 'Rüzgâr şiddeti', puan: 0, agirlik: 0,
      veriYok: true, gerekce: 'Rüzgâr verisi alınamadı.',
    });
  }

  // --- Rüzgâr yönü ----------------------------------------------------
  if (typeof kosul.ruzgarYonu === 'number') {
    const r = ruzgar(kosul.ruzgarYonu);
    let p = 0.65;
    let not = `${r.ad} (${r.yon}).`;
    if (tur.ruzgarTercihi.includes(r.id)) {
      p = 1;
      not += ` ${tur.ad} için makbul rüzgâr.`;
    } else if (tur.ruzgarKacinilan.includes(r.id)) {
      p = 0.25;
      not += ` ${tur.ad} avı için istenmeyen rüzgâr.`;
    } else {
      not += ' Bu tür için nötr.';
    }
    faktorler.push({
      id: 'ruzgarYonu', ad: 'Rüzgâr yönü', puan: p,
      agirlik: AGIRLIKLAR.ruzgarYonu, gerekce: not,
    });
  } else {
    faktorler.push({
      id: 'ruzgarYonu', ad: 'Rüzgâr yönü', puan: 0, agirlik: 0,
      veriYok: true, gerekce: 'Rüzgâr yönü verisi alınamadı.',
    });
  }

  // --- Dalga ----------------------------------------------------------
  if (typeof kosul.dalga === 'number') {
    let p = egriden(DALGA_EGRISI, kosul.dalga);
    let not = `${sayiMetni(kosul.dalga, 2)} m. Kıyıdan av için 0,2-0,5 m arası en verimli bant.`;

    // Aynı yükseklikteki kısa periyotlu çırpıntı, uzun periyotlu ölü dalgadan
    // hem daha rahatsız edici hem de suyu daha çok bulandırıyor.
    if (typeof kosul.dalgaPeriyodu === 'number' && kosul.dalga >= 0.35) {
      if (kosul.dalgaPeriyodu < 3) {
        p *= 0.85;
        not += ` Periyot ${sayiMetni(kosul.dalgaPeriyodu)} sn — kısa ve sert çırpıntı.`;
      } else if (kosul.dalgaPeriyodu >= 5) {
        not += ` Periyot ${sayiMetni(kosul.dalgaPeriyodu)} sn — uzun ölü dalga, kıyıda daha yönetilebilir.`;
      }
    }

    if (kosul.dalga >= TEHLIKE.dalgaM) {
      tehlike = true;
      uyarilar.push(`Dalga ${sayiMetni(kosul.dalga)} m. Kayalık ve mendirek başı tehlikeli.`);
    }
    faktorler.push({
      id: 'dalga', ad: 'Dalga', puan: p, agirlik: AGIRLIKLAR.dalga, gerekce: not,
    });
  } else {
    faktorler.push({
      id: 'dalga', ad: 'Dalga', puan: 0, agirlik: 0,
      veriYok: true, gerekce: 'Dalga verisi alınamadı.',
    });
  }

  // --- Basınç eğilimi -------------------------------------------------
  if (typeof kosul.basincEgilimi === 'number') {
    const p = egriden(BASINC_EGRISI, kosul.basincEgilimi);
    const e = kosul.basincEgilimi;
    const [yon, yorum] = e < -3 ? ['hızla düşüyor', 'Isırık artabilir ama hava bozuyor; çıkmadan önce rüzgâra bak.']
      : e < -0.5 ? ['düşüyor', 'Düşen basınç balığı hareketlendirir — en makbul durum.']
      : e > 3 ? ['hızla yükseliyor', 'Fırtına sonrası yükselen basınçta balık birkaç gün durgunlaşır.']
      : e > 0.5 ? ['yükseliyor', 'Yükselen basınçta aktivite genelde azalır.']
      : ['sabit', 'Sabit basınç ne artı ne eksi; diğer faktörler belirleyici olur.'];
    faktorler.push({
      id: 'basinc', ad: 'Hava basıncı', puan: p, agirlik: AGIRLIKLAR.basinc,
      gerekce: `6 saatte ${e > 0 ? '+' : ''}${sayiMetni(e)} hPa — ${yon}. ${yorum}`,
    });
  } else {
    faktorler.push({
      id: 'basinc', ad: 'Hava basıncı', puan: 0, agirlik: 0,
      veriYok: true, gerekce: 'Basınç verisi alınamadı.',
    });
  }

  // --- Saat / ışık ----------------------------------------------------
  {
    const dilim = saatDilimi(istanbulSaat(kosul.tarih));
    let p = tur.aktifSaatler.includes(dilim) ? 1
      : (KOMSU_DILIM[dilim] ?? []).some((d) => tur.aktifSaatler.includes(d)) ? 0.7
      : 0.4;
    let not = `Şu an ${SAAT_ADLARI[dilim]}. ${tur.ad} en çok ${tur.aktifSaatler.map((s) => SAAT_ADLARI[s] ?? s).join(', ').toLowerCase()} saatlerinde avlanır.`;

    for (const [an, etiket, dilimAdi] of [
      [kosul.gunDogumu, 'gün doğumu', 'safak'],
      [kosul.gunBatimi, 'gün batımı', 'aksam'],
    ] as const) {
      if (an && tur.aktifSaatler.includes(dilimAdi) && dakikaFarki(kosul.tarih, an) <= 60) {
        p = 1;
        not += ` ${etiket.charAt(0).toUpperCase() + etiket.slice(1)}na 1 saatten az var — altın saat.`;
        break;
      }
    }

    faktorler.push({ id: 'saat', ad: 'Saat', puan: p, agirlik: AGIRLIKLAR.saat, gerekce: not });
  }

  // --- Ay evresi (sadece gece avlanan türler) -------------------------
  if (tur.gece) {
    const evre = ayEvresi(kosul.tarih);
    const p = evre.ucaUzaklikGun <= 2 ? 1 : evre.ucaUzaklikGun <= 4 ? 0.8 : 0.6;
    faktorler.push({
      id: 'ayEvresi', ad: 'Ay evresi', puan: p, agirlik: AGIRLIKLAR.ayEvresi,
      gerekce: `${evre.simge} ${evre.ad} (%${Math.round(evre.aydinlanma * 100)} aydınlık). Gece avında yeni ay ve dolunay civarı makbuldür.`,
    });
  }

  // --- Yağış / bulut --------------------------------------------------
  if (typeof kosul.yagis === 'number' || typeof kosul.bulut === 'number') {
    let p = 1;
    const parcalar: string[] = [];
    if (typeof kosul.bulut === 'number') {
      p *= kosul.bulut < 15 ? 0.88 : kosul.bulut > 90 ? 0.92 : 1;
      parcalar.push(`bulut %${Math.round(kosul.bulut)}`);
    }
    if (typeof kosul.yagis === 'number') {
      p *= kosul.yagis > 4 ? 0.45 : kosul.yagis > 0.4 ? 0.85 : 1;
      if (kosul.yagis > 4) uyarilar.push('Kuvvetli yağış bekleniyor.');
      parcalar.push(`yağış ${sayiMetni(kosul.yagis)} mm`);
    }
    faktorler.push({
      id: 'hava', ad: 'Gökyüzü', puan: p, agirlik: AGIRLIKLAR.hava,
      gerekce: `${parcalar.join(', ')}. Hafif bulutlu hava avcı balığı cesaretlendirir.`,
    });
  }

  // --- Toplam ---------------------------------------------------------
  const etkin = faktorler.filter((f) => f.agirlik > 0);
  const toplamAgirlik = etkin.reduce((t, f) => t + f.agirlik, 0);
  const sadeceMevsim = toplamAgirlik === 0;
  const kosulPuani = sadeceMevsim
    ? 0.6
    : etkin.reduce((t, f) => t + f.puan * f.agirlik, 0) / toplamAgirlik;

  let skor = 100 * Math.pow(mevsimPuani, MEVSIM_USSU) * (KOSUL_TABANI + (1 - KOSUL_TABANI) * kosulPuani);
  if (tehlike) skor = Math.min(skor, 40);
  skor = Math.max(0, Math.min(100, Math.round(skor)));

  const seviye: Seviye = skor >= SEVIYE_ESIKLERI.cokIyi ? 'cokIyi'
    : skor >= SEVIYE_ESIKLERI.iyi ? 'iyi'
    : skor >= SEVIYE_ESIKLERI.orta ? 'orta' : 'dusuk';

  return {
    skor, seviye, seviyeMetni: SEVIYE_METNI[seviye],
    mevsimPuani, faktorler, uyarilar, tehlike, sadeceMevsim,
  };
}

/** Bir tür listesini verilen koşullara göre skorlayıp sıralar. */
export function turleriSirala<T extends TurProfili>(
  turler: T[], kosul: Kosullar,
): { tur: T; sonuc: SkorSonucu }[] {
  return turler
    .map((tur) => ({ tur, sonuc: skorHesapla(tur, kosul) }))
    .sort((a, b) => b.sonuc.skor - a.sonuc.skor);
}
