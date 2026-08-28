/**
 * Metin biçimlendirme yardımcıları.
 *
 * Türkçe'de büyük/küçük harf dönüşümü İngilizce'den farklıdır:
 *   i → İ  ve  ı → I
 * Bu yüzden her yerde `toLocaleUpperCase('tr')` kullanılıyor.
 */

/** Tek bir kelimenin ilk harfini Türkçe kurallarına göre büyütür. */
function kelimeBuyut(kelime: string): string {
  if (!kelime) return kelime;
  // Parantez, tırnak gibi işaretlerden sonraki ilk harfi bulup büyütüyoruz.
  return kelime.replace(/^([^\p{L}\p{N}]*)(\p{L})/u, (_, onek: string, harf: string) =>
    onek + harf.toLocaleUpperCase('tr'));
}

/** Türkçe küçültme; "İ" küçülünce araya giren birleşen noktayı (U+0307) temizler. */
function kucult(s: string): string {
  return s.normalize('NFC').toLocaleLowerCase('tr').replace(/\u0307/g, '');
}

/**
 * Başlık biçiminde küçük kalan kelimeler. TDK yazımına göre başlıklarda
 * "ve, ile, ya, veya, yahut, ki, da, de" bağlaçları ve "mı/mi/mu/mü" soru eki
 * küçük yazılır. İlk kelime bunun dışındadır: başlık her zaman büyük başlar.
 */
const KUCUK_KALAN = new Set([
  've', 'ile', 'ya', 'veya', 'yahut', 'ki', 'da', 'de',
  'mı', 'mi', 'mu', 'mü',
]);

/**
 * Başlık biçimi: her kelimenin ilk harfi büyük. Sayfa ve bölüm başlıkları,
 * rozetler ve kısa etiketler bunu kullanır.
 * "çok kolay" → "Çok Kolay", "yem ve sahte yem" → "Yem ve Sahte Yem"
 *
 * Cümleler için kullanma — açıklama metinleri cümle biçiminde kalır.
 */
export function baslikBicimi(metin: string): string {
  let ilkKelimeGecildi = false;
  return metin.split(/(\s+)/).map((p) => {
    if (!p || /\s/.test(p)) return p;
    // Kelimeyi çevreleyen noktalama, bağlaç eşleşmesini bozmasın: "mi?" → "mi"
    const cekirdek = kucult(p.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''));
    if (!cekirdek) return p;                       // "·" gibi ayraçlar
    const ilk = !ilkKelimeGecildi;
    ilkKelimeGecildi = true;
    if (!ilk && KUCUK_KALAN.has(cekirdek)) return p;
    return kelimeBuyut(p);
  }).join('');
}

/** Cümle biçimi: yalnızca ilk harf büyük. Açıklama metinleri için. */
export function cumleBicimi(metin: string): string {
  return kelimeBuyut(metin);
}

/**
 * Ondalıklı sayı — Türkçe ayraçla. `toFixed()` çıktısını doğrudan ekrana basma:
 * nokta ayracı İngilizce yazımdır ve ölçü değerleriyle birlikte yanlış okunur.
 *
 * Koordinat gibi teknik değerler bunun dışındadır; onlar noktayla yazılır.
 */
export function sayiMetni(deger: number, basamak = 1): string {
  return deger.toFixed(basamak).replace('.', ',');
}
