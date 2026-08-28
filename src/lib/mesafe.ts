/** İki koordinat arası kuş uçuşu mesafe (km) — haversine. */
export function mesafeKm(
  aLat: number, aLng: number, bLat: number, bLng: number,
): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Okunabilir mesafe. Türkçe ondalık ayracı virgüldür; 10 km'den sonra
 * ondalık basamak bilgi taşımadığı için yuvarlanır.
 */
export function mesafeMetni(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}
