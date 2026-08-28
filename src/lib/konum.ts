/**
 * Tarayıcı konumu.
 *
 * Konum **yalnızca kullanıcı açıkça istediğinde** sorulur; sayfa açılışında izin
 * istemi çıkarmıyoruz. İzin verilmezse hiçbir şey bozulmaz: liste alfabetik
 * kalır, harita kapsam alanına çerçevelenir.
 */

export interface Konum {
  lat: number;
  lng: number;
  /** Metre cinsinden yatay doğruluk. */
  dogruluk: number;
}

export type KonumHatasi = 'desteklenmiyor' | 'reddedildi' | 'bulunamadi' | 'zamanAsimi';

export const KONUM_HATA_METNI: Record<KonumHatasi, string> = {
  desteklenmiyor: 'Bu tarayıcı konum bilgisi vermiyor.',
  reddedildi: 'Konum izni verilmedi. Tarayıcı ayarlarından bu siteye izin verip tekrar deneyebilirsin.',
  bulunamadi: 'Konum alınamadı. Kapalı alandaysan dışarıda tekrar dene.',
  zamanAsimi: 'Konum alma zaman aşımına uğradı. Tekrar dene.',
};

/**
 * Konum kullanılabilir mi? Güvenli bağlam şartı önemli: `http` üzerinde
 * `navigator.geolocation` var görünür ama istek sessizce başarısız olur.
 */
export function konumDestekli(): boolean {
  return typeof navigator !== 'undefined'
    && 'geolocation' in navigator
    && typeof isSecureContext !== 'undefined'
    && isSecureContext;
}

export function konumAl(zamanAsimiMs = 10_000): Promise<Konum> {
  if (!konumDestekli()) return Promise.reject<Konum>('desteklenmiyor' as KonumHatasi);

  return new Promise<Konum>((coz, reddet) => {
    navigator.geolocation.getCurrentPosition(
      (p) => coz({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        dogruluk: p.coords.accuracy,
      }),
      (hata) => {
        const kod: KonumHatasi =
          hata.code === hata.PERMISSION_DENIED ? 'reddedildi'
          : hata.code === hata.TIMEOUT ? 'zamanAsimi'
          : 'bulunamadi';
        reddet(kod);
      },
      { enableHighAccuracy: false, timeout: zamanAsimiMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}

/** Yakalanan değeri okunabilir bir cümleye çevirir. */
export function konumHataMetni(hata: unknown): string {
  return typeof hata === 'string' && hata in KONUM_HATA_METNI
    ? KONUM_HATA_METNI[hata as KonumHatasi]
    : KONUM_HATA_METNI.bulunamadi;
}
