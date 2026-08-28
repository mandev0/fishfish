/**
 * Open-Meteo istemcisi — anahtar gerektirmez, CORS açıktır, tarayıcıdan çağrılır.
 *
 *   forecast : rüzgâr, basınç, bulut, yağış, gün doğumu/batımı
 *   marine   : dalga yüksekliği, deniz suyu sıcaklığı
 *
 * İki uç noktadan biri düşerse diğeriyle devam ederiz; ikisi de düşerse
 * `null` döneriz ve arayüz statik (mevsime dayalı) moda geçer.
 */

import { isoyuCozumle } from '../time';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const ZAMAN_ASIMI_MS = 8000;
/** Bu yaşın altındaki paket "canlı" sayılır; üstü açıkça bayat olarak etiketlenir. */
export const ONBELLEK_SURESI_MS = 15 * 60 * 1000;
/**
 * Ağ yokken kabul edilen en eski paket. Tahmin dizisi dünden +2 güne uzandığı
 * için bir gün öncesine kadar olan paket hâlâ "şu an"ı kapsıyor; ötesi kapsamıyor,
 * o yüzden bayat veriyi göstermek yerine mevsimsel listeye düşüyoruz.
 */
const BAYAT_SINIRI_MS = 24 * 60 * 60 * 1000;
const ONBELLEK_ONEKI = 'fishfish:hava:';

export interface HavaPaketi {
  konum: { lat: number; lng: number };
  guncelleme: number;
  zaman: Date[];
  sicaklik: (number | null)[];
  yagis: (number | null)[];
  bulut: (number | null)[];
  basinc: (number | null)[];
  ruzgarHizi: (number | null)[];
  ruzgarYonu: (number | null)[];
  ruzgarHamlesi: (number | null)[];
  uv: (number | null)[];
  gorus: (number | null)[];
  dalga: (number | null)[];
  dalgaPeriyodu: (number | null)[];
  suSicakligi: (number | null)[];
  denizSeviyesi: (number | null)[];
  /** Üç günlük ortalama deniz seviyesi — anlık değeri buna göre yorumluyoruz. */
  denizSeviyesiOrtalama: number | null;
  gunler: { tarih: string; gunDogumu: Date; gunBatimi: Date }[];
  eksik: string[];
}

function zamanAsimliIstek(url: string): Promise<Response> {
  const kontrol = new AbortController();
  const zamanlayici = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI_MS);
  return fetch(url, { signal: kontrol.signal }).finally(() => clearTimeout(zamanlayici));
}

function anahtar(lat: number, lng: number): string {
  return `${ONBELLEK_ONEKI}${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function onbellektenOku(
  lat: number, lng: number, azamiYasMs: number = ONBELLEK_SURESI_MS,
): HavaPaketi | null {
  try {
    const ham = localStorage.getItem(anahtar(lat, lng));
    if (!ham) return null;
    const veri = JSON.parse(ham) as HavaPaketi;
    if (Date.now() - veri.guncelleme > azamiYasMs) return null;
    // JSON serileştirmesi Date'leri metne çevirdi, geri alıyoruz.
    veri.zaman = veri.zaman.map((z) => new Date(z as unknown as string));
    veri.gunler = veri.gunler.map((g) => ({
      tarih: g.tarih,
      gunDogumu: new Date(g.gunDogumu as unknown as string),
      gunBatimi: new Date(g.gunBatimi as unknown as string),
    }));
    return veri;
  } catch {
    return null;
  }
}

function onbellegeYaz(paket: HavaPaketi): void {
  try {
    localStorage.setItem(anahtar(paket.konum.lat, paket.konum.lng), JSON.stringify(paket));
  } catch {
    /* Özel sekme, dolu kota vs. — önbellek olmadan da çalışırız. */
  }
}

const bosDizi = (n: number): null[] => Array.from({ length: n }, () => null);

function ortalama(dizi: (number | null)[]): number | null {
  const sayilar = dizi.filter((v): v is number => typeof v === 'number');
  if (!sayilar.length) return null;
  return sayilar.reduce((t, v) => t + v, 0) / sayilar.length;
}

export async function havaGetir(
  lat: number, lng: number, { tazele = false } = {},
): Promise<HavaPaketi | null> {
  if (!tazele) {
    const onbellek = onbellektenOku(lat, lng);
    if (onbellek) return onbellek;
  }

  const forecastUrl = `${FORECAST_URL}?latitude=${lat}&longitude=${lng}`
    + '&hourly=temperature_2m,precipitation,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility'
    // past_days=1: basınç eğilimi için geriye dönük 6 saatlik geçmiş gerekiyor.
    + '&daily=sunrise,sunset&timezone=Europe%2FIstanbul&forecast_days=3&past_days=1';

  const marineUrl = `${MARINE_URL}?latitude=${lat}&longitude=${lng}`
    + '&hourly=wave_height,wave_period,sea_surface_temperature,sea_level_height_msl'
    + '&timezone=Europe%2FIstanbul&forecast_days=3&past_days=1';

  const [havaSonuc, denizSonuc] = await Promise.allSettled([
    zamanAsimliIstek(forecastUrl).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
    zamanAsimliIstek(marineUrl).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
  ]);

  if (havaSonuc.status !== 'fulfilled') {
    // Ağ yok ya da uç nokta düştü. Bayat da olsa elimizdeki paketle devam ederiz:
    // birkaç saat önce çekilmiş bir tahmin, hiç veri olmamasından çok daha iyidir.
    // Paketin `guncelleme` damgası duruyor, arayüz yaşını açıkça yazıyor.
    return onbellektenOku(lat, lng, BAYAT_SINIRI_MS);
  }

  const hava = havaSonuc.value;
  const ofset: number = hava.utc_offset_seconds ?? 10800;
  const zaman: Date[] = (hava.hourly?.time ?? []).map((t: string) => isoyuCozumle(t, ofset));
  const n = zaman.length;
  const eksik: string[] = [];

  let dalga: (number | null)[] = bosDizi(n);
  let dalgaPeriyodu: (number | null)[] = bosDizi(n);
  let suSicakligi: (number | null)[] = bosDizi(n);
  let denizSeviyesi: (number | null)[] = bosDizi(n);

  if (denizSonuc.status === 'fulfilled') {
    const deniz = denizSonuc.value;
    const denizOfset: number = deniz.utc_offset_seconds ?? ofset;
    // Deniz ve hava saat dizileri kural olarak aynı; yine de damgaya göre eşliyoruz.
    const indeks = new Map<number, number>();
    (deniz.hourly?.time ?? []).forEach((t: string, i: number) => {
      indeks.set(isoyuCozumle(t, denizOfset).getTime(), i);
    });
    const esle = (alan: string) => zaman.map((z) => {
      const i = indeks.get(z.getTime());
      return i === undefined ? null : (deniz.hourly?.[alan]?.[i] ?? null);
    });
    dalga = esle('wave_height');
    dalgaPeriyodu = esle('wave_period');
    suSicakligi = esle('sea_surface_temperature');
    denizSeviyesi = esle('sea_level_height_msl');
  } else {
    eksik.push('deniz');
  }

  const gunler = (hava.daily?.time ?? []).map((t: string, i: number) => ({
    tarih: t,
    gunDogumu: isoyuCozumle(hava.daily.sunrise[i], ofset),
    gunBatimi: isoyuCozumle(hava.daily.sunset[i], ofset),
  }));

  const paket: HavaPaketi = {
    konum: { lat, lng },
    guncelleme: Date.now(),
    zaman,
    sicaklik: hava.hourly?.temperature_2m ?? bosDizi(n),
    yagis: hava.hourly?.precipitation ?? bosDizi(n),
    bulut: hava.hourly?.cloud_cover ?? bosDizi(n),
    basinc: hava.hourly?.surface_pressure ?? bosDizi(n),
    ruzgarHizi: hava.hourly?.wind_speed_10m ?? bosDizi(n),
    ruzgarYonu: hava.hourly?.wind_direction_10m ?? bosDizi(n),
    ruzgarHamlesi: hava.hourly?.wind_gusts_10m ?? bosDizi(n),
    uv: hava.hourly?.uv_index ?? bosDizi(n),
    gorus: hava.hourly?.visibility ?? bosDizi(n),
    dalga,
    dalgaPeriyodu,
    suSicakligi,
    denizSeviyesi,
    denizSeviyesiOrtalama: ortalama(denizSeviyesi),
    gunler,
    eksik,
  };

  onbellegeYaz(paket);
  return paket;
}

/** Verilen ana en yakın saat dilimi indeksi. */
export function saatIndeksi(zaman: Date[], hedef: Date = new Date()): number {
  if (zaman.length === 0) return -1;
  let enIyi = 0;
  let enIyiFark = Infinity;
  for (let i = 0; i < zaman.length; i++) {
    const fark = Math.abs(zaman[i]!.getTime() - hedef.getTime());
    if (fark < enIyiFark) { enIyiFark = fark; enIyi = i; }
  }
  return enIyi;
}

export interface AnlikKosul {
  tarih: Date;
  sicaklik: number | null;
  suSicakligi: number | null;
  dalga: number | null;
  ruzgarHizi: number | null;
  ruzgarYonu: number | null;
  ruzgarHamlesi: number | null;
  basincEgilimi: number | null;
  bulut: number | null;
  yagis: number | null;
  uv: number | null;
  gorus: number | null;
  dalgaPeriyodu: number | null;
  /** Deniz seviyesinin üç günlük ortalamadan sapması (metre). Lodos yükseltir, poyraz düşürür. */
  denizSeviyesiSapmasi: number | null;
  gunDogumu: Date | null;
  gunBatimi: Date | null;
}

/** Paketten belirli bir andaki koşulları çıkarır. */
export function anlikKosul(paket: HavaPaketi, an: Date = new Date()): AnlikKosul | null {
  const i = saatIndeksi(paket.zaman, an);
  if (i < 0) return null;

  const oncekiBasinc = paket.basinc[Math.max(0, i - 6)];
  const suankiBasinc = paket.basinc[i];
  const basincEgilimi = (typeof oncekiBasinc === 'number' && typeof suankiBasinc === 'number' && i >= 6)
    ? suankiBasinc - oncekiBasinc
    : null;

  const gunDamgasi = paket.zaman[i]!;
  const gun = paket.gunler.find((g) => {
    const b = g.gunDogumu;
    return b.getFullYear() === gunDamgasi.getFullYear()
      && b.getMonth() === gunDamgasi.getMonth()
      && b.getDate() === gunDamgasi.getDate();
  }) ?? paket.gunler[0];

  return {
    tarih: paket.zaman[i]!,
    sicaklik: paket.sicaklik[i] ?? null,
    suSicakligi: paket.suSicakligi[i] ?? null,
    dalga: paket.dalga[i] ?? null,
    ruzgarHizi: paket.ruzgarHizi[i] ?? null,
    ruzgarYonu: paket.ruzgarYonu[i] ?? null,
    ruzgarHamlesi: paket.ruzgarHamlesi[i] ?? null,
    basincEgilimi,
    bulut: paket.bulut[i] ?? null,
    yagis: paket.yagis[i] ?? null,
    uv: paket.uv[i] ?? null,
    gorus: paket.gorus[i] ?? null,
    dalgaPeriyodu: paket.dalgaPeriyodu[i] ?? null,
    denizSeviyesiSapmasi:
      typeof paket.denizSeviyesi[i] === 'number' && typeof paket.denizSeviyesiOrtalama === 'number'
        ? paket.denizSeviyesi[i]! - paket.denizSeviyesiOrtalama
        : null,
    gunDogumu: gun?.gunDogumu ?? null,
    gunBatimi: gun?.gunBatimi ?? null,
  };
}
