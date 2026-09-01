/**
 * Tür ↔ yöntem eşlemesi.
 *
 * Bu bilgi depoda **iki ayrı yerde** duruyor ve ikisi de tek başına eksik:
 *
 * - `methods[].turler` — yöntem kaydına elle yazılmış tür listesi.
 * - `species[].takimlar → rigs[].yontem` — takım katmanından türeyen liste.
 *
 * Örnek: levrek takımlarından `dip-yemli` çıkıyor ama yöntem kaydında yok;
 * yöntem kaydında `surf` var ama levreğin takımlarında yok. İkisi de doğru.
 * Bu yüzden filtre **birleşimi** kullanır — biri unutulduğunda tür sessizce
 * kaybolmasın diye. Ayrışma `npm run validate` çıktısında uyarı olarak listelenir.
 *
 * Yöntem "nasıl avlandığın", takım "neyi bağladığın": ikisi ayrı katman.
 * Bu dosya o iki katmanı birleştiren tek yerdir; sayfalar kendi eşlemesini kurmasın.
 */

interface TurGirdisi { id: string; takimlar: string[] }
interface TakimGirdisi { id: string; yontem: string }
interface YontemGirdisi { id: string; turler: string[] }

/**
 * Her tür için o türün avlanabildiği yöntemlerin kimlikleri.
 * Sıra `yontemler` dizisinin sırasıdır — çağıran taraf onu zorluğa göre
 * sıralarsa çıktı da zorluğa göre sıralı gelir.
 */
export function turYontemleri(
  turler: TurGirdisi[],
  takimlar: TakimGirdisi[],
  yontemler: YontemGirdisi[],
): Record<string, string[]> {
  const takimYontemi = new Map(takimlar.map((r) => [r.id, r.yontem]));
  const sira = yontemler.map((y) => y.id);

  const harita: Record<string, string[]> = {};
  for (const t of turler) {
    const bulunan = new Set<string>();
    for (const takimId of t.takimlar) {
      const y = takimYontemi.get(takimId);
      if (y) bulunan.add(y);
    }
    for (const y of yontemler) {
      if (y.turler.includes(t.id)) bulunan.add(y.id);
    }
    harita[t.id] = sira.filter((y) => bulunan.has(y));
  }
  return harita;
}

/**
 * İki kaynağın ayrıştığı yerler — `validate` bunu uyarı olarak basar.
 * Eksikliği kapatmak veri işidir; filtre birleşimle çalışmaya devam eder.
 */
export function yontemAyrismalari(
  turler: TurGirdisi[],
  takimlar: TakimGirdisi[],
  yontemler: YontemGirdisi[],
): { tur: string; takimdanEksik: string[]; yontemdenEksik: string[] }[] {
  const takimYontemi = new Map(takimlar.map((r) => [r.id, r.yontem]));
  const ayrisan = [];
  for (const t of turler) {
    const takimdan = new Set(t.takimlar.map((id) => takimYontemi.get(id)).filter(Boolean) as string[]);
    const yontemden = new Set(yontemler.filter((y) => y.turler.includes(t.id)).map((y) => y.id));
    const takimdanEksik = [...yontemden].filter((y) => !takimdan.has(y)).sort();
    const yontemdenEksik = [...takimdan].filter((y) => !yontemden.has(y)).sort();
    if (takimdanEksik.length || yontemdenEksik.length) {
      ayrisan.push({ tur: t.id, takimdanEksik, yontemdenEksik });
    }
  }
  return ayrisan;
}
