/**
 * "Bugün ne tutulur?" paneli.
 *
 * Sunucu tarafında sayfaya statik (aya dayalı) bir liste basılır.
 * Bu betik canlı hava/deniz verisini çeker, skorları hesaplar ve
 * statik listenin yerine canlı listeyi koyar. Veri gelmezse statik
 * liste olduğu gibi kalır — sayfa hiçbir koşulda boş görünmez.
 */

import { anlikKosul, havaGetir, ONBELLEK_SURESI_MS, type HavaPaketi } from '../../lib/api/openMeteo';
import { ikonSvg } from '../../lib/ikonlar';
import { konumAl, konumDestekli, konumHataMetni } from '../../lib/konum';
import { mesafeKm, mesafeMetni } from '../../lib/mesafe';
import { ayEvresi } from '../../lib/moon';
import { turleriSirala, type SkorSonucu, type TurProfili } from '../../lib/score';
import { sayiMetni } from '../../lib/metin';
import { gecenSureMetni, saatMetni } from '../../lib/time';
import { beaufortAdi, KIYI_ILISKISI_METNI, kiyiIliskisi, ruzgar } from '../../lib/wind';

interface Nokta {
  id: string; ad: string; il: string; bolge: string;
  lat: number; lng: number; kiyiYonu: number; turler: string[];
  /** Open-Meteo deniz modelinin kapsamadığı kapalı/sığ sular. */
  denizVerisiZayif?: boolean;
  tatliSu?: boolean;
}
/** Karar kartının ihtiyaç duyduğu, skorlamaya girmeyen alanlar. */
interface KararAlanlari {
  takimAd: string | null;
  yontemAd: string | null;
  takimId: string | null;
  nerede: string;
  saatler: string[];
  /** Kaynaklı veriden gelir; kaydı olmayan türde null. */
  asgariBoy: number | null;
  ekipman: [string, string][];
}
type PanelTuru = TurProfili & { ozet: string } & KararAlanlari;

interface Veri { noktalar: Nokta[]; turler: PanelTuru[] }

const SECIM_ANAHTARI = 'fishfish:nokta';
const IL_ANAHTARI = 'fishfish:il';

/** Sayfa geçişlerinde yenilenen yükleyici; `online` dinleyicisi bunu çağırır. */
let aktifYukle: ((tazele?: boolean) => Promise<void>) | null = null;
let cevrimiciBagli = false;

const kacir = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Skor rozeti, zorluk/bolluk rozetleriyle aynı pastel skalayı kullanır. */
const SEVIYE_SINIFI: Record<SkorSonucu['seviye'], string> = {
  cokIyi: 'bolluk-5',
  iyi: 'bolluk-4',
  orta: 'zorluk-3',
  dusuk: 'bolluk-1',
};

function durumKarti(ikon: string, baslik: string, deger: string, alt: string): string {
  return `<div class="kart p-4">
    <p class="etiket-ust">
      ${ikonSvg(ikon, 'size-[15px] shrink-0')}${kacir(baslik)}
    </p>
    <p class="sayisal mt-1 text-lg font-semibold leading-tight">${kacir(deger)}</p>
    <p class="mt-0.5 text-xs text-muted">${kacir(alt)}</p>
  </div>`;
}

/**
 * Karar kartı — tasarım 1b.
 *
 * Panelin en üstünde tek bir "bunu yap" der: hedef tür, hangi takımla,
 * ne zaman ve nerede. Altında skor motorunun kendi gerekçeleri, türün
 * ekipman satırları ve kaynaklı yasal boy notu var.
 *
 * Tasarımdaki metinlerin hiçbiri sabit yazılmadı: saat penceresi günün
 * gerçek batımından, gerekçeler skor faktörlerinden, ekipman ve boy
 * limiti tür verisinden geliyor.
 */
function kararKarti(
  tur: PanelTuru,
  sonuc: SkorSonucu,
  nokta: Nokta,
  gunBatimi: Date | null | undefined,
  alternatifler: { tur: PanelTuru; sonuc: SkorSonucu }[],
): string {
  // En güçlü üç olumlu faktör — motorun kendi gerekçe cümleleriyle.
  const nedenler = sonuc.faktorler
    .filter((f) => f.agirlik > 0 && !f.veriYok && f.puan >= 0.6)
    .sort((a, b) => b.puan * b.agirlik - a.puan * a.agirlik)
    .slice(0, 3);

  const saatMetinleri = tur.saatler.map((x) => x.toLocaleLowerCase('tr'));
  const pencere = saatMetinleri.length ? saatMetinleri.join(' · ') : 'gün boyu';
  // Batım saatini yalnızca tür alacada/gecede aktifse yazıyoruz; öğlen
  // avlanan bir tür için batım saati bilgi değil gürültü.
  const alacaci = tur.aktifSaatler.some((x) => x === 'aksam' || x === 'gece');
  const batimNotu = alacaci && gunBatimi ? ` Batım ${saatMetni(gunBatimi)}.` : '';

  const yontem = tur.yontemAd ?? tur.takimAd;
  const baslik = yontem ? `${kacir(tur.ad)}<br>${kacir(yontem.toLocaleLowerCase('tr'))} ile` : kacir(tur.ad);

  const boyNotu = tur.asgariBoy != null
    ? `<b class="font-medium">Asgari boy ${tur.asgariBoy} cm.</b> Altındakini suya bırak.`
    : 'Bu tür için kayıtlı asgari boy yok; yürürlükteki tebliği kontrol et.';

  return `
  <div class="kart kart-vurgulu p-4">
    <p class="etiket-ust" style="color:var(--accent-500)">${kacir(sonuc.seviyeMetni)} · En Yüksek Şans</p>
    <p class="mt-1.5 text-[27px] font-medium leading-[1.1] tracking-tight">${baslik}</p>
    <p class="mt-2 text-[13px] leading-relaxed text-accent-300">
      ${kacir(pencere)} saatlerinde.${kacir(batimNotu)} ${kacir(tur.nerede)}
    </p>
    <div class="mt-4 flex gap-2">
      <a href="/balik/${kacir(tur.id)}" class="dugme dugme-birincil flex-1">Türü Aç</a>
      ${tur.takimId
        ? `<a href="/takim/${kacir(tur.takimId)}" class="dugme dugme-ikincil flex-1">Takımı Kur</a>`
        : ''}
    </div>
  </div>

  ${nedenler.length ? `
  <h4 class="etiket-ust mt-5">Neden</h4>
  <ul class="mt-2 flex flex-col gap-2">
    ${nedenler.map((f) => `<li class="flex gap-2.5 text-[13px] leading-relaxed text-neutral-300">
      ${ikonSvg('check', 'mt-[3px] size-3.5 shrink-0 text-accent-600')}
      <span><b class="font-medium">${kacir(f.ad)}</b> — ${kacir(f.gerekce)}</span>
    </li>`).join('')}
  </ul>` : ''}

  ${tur.ekipman.length ? `
  <h4 class="etiket-ust mt-5">Ne Götürüyorsun</h4>
  <div class="kart mt-2 overflow-hidden">
    ${tur.ekipman.map(([k, v], i) => `<div class="flex justify-between gap-3 px-3 py-2.5 text-[13px]${
      i ? ' border-t border-line' : ''}">
      <span class="shrink-0 text-muted">${kacir(k)}</span>
      <span class="text-right">${kacir(v)}</span>
    </div>`).join('')}
  </div>` : ''}

  <div class="mt-3 flex gap-2 rounded-md bg-accent-900/60 p-3 text-[12px] leading-relaxed text-accent-300"
       style="box-shadow:0 0 0 1px #3a3358">
    ${ikonSvg('ruler', 'mt-[2px] size-3.5 shrink-0')}<div>${boyNotu}</div>
  </div>

  ${alternatifler.length ? `
  <h4 class="etiket-ust mt-5">Alternatifler</h4>
  <div class="mt-2 flex flex-col gap-2">
    ${alternatifler.map(({ tur: a, sonuc: as_ }) => `
      <a href="/balik/${kacir(a.id)}" class="kart flex items-center gap-3 px-3 py-2.5">
        ${ikonSvg('fish', 'size-[18px] shrink-0 text-accent-500')}
        <span class="min-w-0 flex-1">
          <span class="block text-[13.5px] font-medium">${kacir(a.ad)}</span>
          <span class="block text-[11px] text-muted">${kacir(a.yontemAd ?? a.takimAd ?? '')}${
            a.yontemAd || a.takimAd ? ' · ' : ''}${kacir(as_.seviyeMetni.toLocaleLowerCase('tr'))}</span>
        </span>
        <span class="shrink-0 text-[11px] text-accent-500">${as_.skor}</span>
        ${ikonSvg('caret-right', 'size-3.5 shrink-0 text-neutral-600')}
      </a>`).join('')}
  </div>` : ''}`;
}

function turSatiri(tur: TurProfili & { ozet: string }, sonuc: SkorSonucu): string {
  const faktorler = sonuc.faktorler
    .filter((f) => f.agirlik > 0)
    .map((f) => `<li class="flex items-start justify-between gap-3 py-1.5">
        <span class="min-w-0"><strong class="font-medium">${kacir(f.ad)}</strong>
          <span class="block text-muted">${kacir(f.gerekce)}</span></span>
        <span class="shrink-0 tabular-nums text-muted">${Math.round(f.puan * 100)}%</span>
      </li>`).join('');

  const eksik = sonuc.faktorler.filter((f) => f.veriYok).map((f) => f.ad);

  return `<li class="kart">
    <div class="flex items-center gap-3 p-4">
      <span
        class="sayisal flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-base font-bold ${SEVIYE_SINIFI[sonuc.seviye]}"
        style="background: var(--z-bg); color: var(--z-fg)"
      >${sonuc.skor}</span>
      <div class="min-w-0 flex-1">
        <a href="/balik/${kacir(tur.id)}" class="font-semibold hover:text-vurgu">${kacir(tur.ad)}</a>
        <p class="truncate text-xs text-muted">${kacir(sonuc.seviyeMetni)} · ${kacir(tur.ozet)}</p>
      </div>
    </div>
    <details class="border-t border-line bg-surface-2/40 px-4 py-1">
      <summary class="acilir">Skor Nasıl Hesaplandı?</summary>
      <ul class="mt-2 divide-y divide-line text-xs">${faktorler}</ul>
      ${eksik.length ? `<p class="mt-2 text-xs text-warn">Veri alınamayan faktörler hesaba katılmadı: ${kacir(eksik.join(', '))}.</p>` : ''}
    </details>
  </li>`;
}

export function baslat(): void {
  const kok = document.getElementById('hava-panel');
  const veriEtiketi = document.getElementById('fishfish-veri');
  if (!kok || !veriEtiketi?.textContent) return;

  const veri: Veri = JSON.parse(veriEtiketi.textContent);
  const sabitId = kok.dataset.sabit || null;

  const ilSecici = kok.querySelector<HTMLSelectElement>('[data-il]');
  const secici = kok.querySelector<HTMLSelectElement>('[data-secici]');
  const durumAlani = kok.querySelector<HTMLElement>('[data-durum]');
  const listeAlani = kok.querySelector<HTMLElement>('[data-liste]');
  const uyariAlani = kok.querySelector<HTMLElement>('[data-uyari]');
  const statikAlan = document.querySelector<HTMLElement>('[data-statik]');
  const canliAlanlar = [...kok.querySelectorAll<HTMLElement>('[data-canli]')];
  const durumMetni = kok.querySelector<HTMLElement>('[data-durum-metni]');
  const kararAlani = kok.querySelector<HTMLElement>('[data-karar]');
  const guncellemeDamgasi = kok.querySelector<HTMLElement>('[data-guncelleme]');
  const yenileDugmesi = kok.querySelector<HTMLButtonElement>('[data-yenile]');

  const noktaBul = (id: string | null) =>
    veri.noktalar.find((n) => n.id === id) ?? veri.noktalar[0]!;

  let seciliId = sabitId;

  /**
   * Nokta listesini seçili ile göre daraltır.
   * Sunucu tüm illeri basar; burada yalnızca seçili ilin bölge gruplarını bırakıyoruz.
   * `hidden` yerine grubu DOM'dan çıkarıp geri koymak tarayıcılar arasında güvenilir.
   */
  const tumGruplar = secici ? [...secici.querySelectorAll('optgroup')] : [];
  function noktalariDaralt(il: string): void {
    if (!secici) return;
    for (const grup of tumGruplar) {
      const grubunIli = veri.noktalar.find((n) => n.bolge === grup.dataset.bolge)?.il;
      const uygun = grubunIli === il;
      if (uygun && !grup.parentNode) secici.appendChild(grup);
      else if (!uygun && grup.parentNode) grup.remove();
    }
    // Grup sırası DOM'a eklenme sırasına göre bozulmuş olabilir; özgün sıraya döndür.
    for (const grup of tumGruplar) if (grup.parentNode) secici.appendChild(grup);
  }

  if (!sabitId && secici && ilSecici) {
    let seciliIl = ilSecici.value;
    try {
      const kayitliNokta = localStorage.getItem(SECIM_ANAHTARI);
      const nokta = veri.noktalar.find((n) => n.id === kayitliNokta);
      if (nokta) {
        // Hatırlanan noktanın ili, il kutusunun da başlangıç değeri olsun.
        seciliIl = nokta.il;
        seciliId = nokta.id;
      } else {
        const kayitliIl = localStorage.getItem(IL_ANAHTARI);
        if (kayitliIl && veri.noktalar.some((n) => n.il === kayitliIl)) seciliIl = kayitliIl;
      }
    } catch { /* önbelleksiz devam */ }

    ilSecici.value = seciliIl;
    noktalariDaralt(seciliIl);
    if (seciliId && [...secici.options].some((o) => o.value === seciliId)) secici.value = seciliId;
    seciliId = secici.value;
  } else if (!sabitId && secici) {
    seciliId = secici.value;
  }

  /** Son yenileme damgası — yenile düğmesinin yanında duran kısa ibare. */
  function damgaYaz(metin: string, uyari: boolean): void {
    if (!guncellemeDamgasi) return;
    guncellemeDamgasi.textContent = metin;
    // Hizalama sınıfları (`mr-auto sm:mr-0`) burada da yazılmalı: sınıf listesi
    // baştan kuruluyor, düşerse damga dar ekranda düğmelere yapışıyor.
    guncellemeDamgasi.className = uyari
      ? 'sayisal mr-auto text-xs leading-tight text-warn sm:mr-0'
      : 'sayisal mr-auto text-xs leading-tight text-muted sm:mr-0';
    guncellemeDamgasi.hidden = false;
  }

  async function yukle(tazele = false): Promise<void> {
    const nokta = noktaBul(seciliId);
    damgaYaz('Alınıyor…', false);
    if (yenileDugmesi) yenileDugmesi.disabled = true;

    let paket: HavaPaketi | null = null;
    try {
      paket = await havaGetir(nokta.lat, nokta.lng, { tazele });
    } catch {
      paket = null;
    }
    if (yenileDugmesi) yenileDugmesi.disabled = false;

    if (!paket) {
      damgaYaz('Veri yok', true);
      if (durumMetni) {
        // Buraya yalnızca istek düştüğünde ve 24 saat içinde kayıtlı paket
        // bulunmadığında geliriz; ikisi de kesin bilgi.
        durumMetni.hidden = false;
        durumMetni.textContent =
          'Hava servisine ulaşılamadı ve bu nokta için kayıtlı veri yok.'
          + ' Aşağıdaki liste yalnızca mevsime göre hazırlandı.';
        durumMetni.className = 'mt-2 text-sm text-warn';
      }
      canliAlanlar.forEach((e) => e.setAttribute('hidden', ''));
      statikAlan?.removeAttribute('hidden');
      return;
    }

    const simdi = new Date();
    const k = anlikKosul(paket, simdi);
    if (!k) return;

    const r = typeof k.ruzgarYonu === 'number' ? ruzgar(k.ruzgarYonu) : null;
    const evre = ayEvresi(simdi);

    // --- Durum kartları ---
    if (durumAlani) {
      const kartlar: string[] = [];
      kartlar.push(durumKarti(
        'ruzgar', 'Rüzgâr',
        r ? `${r.ad} ${Math.round(k.ruzgarHizi ?? 0)} km/sa` : 'Veri yok',
        k.ruzgarHizi != null ? beaufortAdi(k.ruzgarHizi) : '—',
      ));
      kartlar.push(durumKarti(
        'sicaklik', 'Deniz Suyu',
        k.suSicakligi != null ? `${sayiMetni(k.suSicakligi)} °C` : 'Veri yok',
        k.sicaklik != null ? `Hava ${Math.round(k.sicaklik)} °C` : '—',
      ));
      kartlar.push(durumKarti(
        'dalga', 'Dalga',
        k.dalga != null ? `${sayiMetni(k.dalga, 2)} m` : 'Veri yok',
        k.dalga != null && k.dalga >= 1.2 ? 'Kıyıda tehlikeli' : 'Kıyıdan av için 0,2-0,5 m ideal',
      ));
      kartlar.push(durumKarti(
        'basinc', 'Basınç',
        k.basincEgilimi != null ? `${k.basincEgilimi > 0 ? '+' : ''}${sayiMetni(k.basincEgilimi)} hPa` : 'Veri yok',
        '6 saatlik değişim',
      ));
      kartlar.push(durumKarti(
        'gece', 'Ay',
        `${evre.simge} ${evre.ad}`,
        `%${Math.round(evre.aydinlanma * 100)} aydınlık`,
      ));
      kartlar.push(durumKarti(
        'saat', 'Gün',
        k.gunDogumu && k.gunBatimi ? `${saatMetni(k.gunDogumu)} – ${saatMetni(k.gunBatimi)}` : 'Veri yok',
        'doğuş – batış',
      ));
      if (typeof k.denizSeviyesiSapmasi === 'number') {
        const cm = Math.round(k.denizSeviyesiSapmasi * 100);
        kartlar.push(durumKarti(
          'dalga', 'Deniz Seviyesi',
          `${cm > 0 ? '+' : ''}${cm} cm`,
          Math.abs(cm) < 8 ? 'normal seviyede'
            : cm > 0 ? 'normalin üstünde — su kayaları örtüyor'
            : 'normalin altında — dip taşları açıkta',
        ));
      }
      if (typeof k.dalgaPeriyodu === 'number' && (k.dalga ?? 0) >= 0.2) {
        kartlar.push(durumKarti(
          'dalga', 'Dalga Periyodu',
          `${sayiMetni(k.dalgaPeriyodu)} sn`,
          k.dalgaPeriyodu < 3 ? 'kısa, sert çırpıntı' : 'uzun, yönetilebilir',
        ));
      }
      durumAlani.innerHTML = kartlar.join('');
    }

    // --- Skorlar ---
    const kosul = {
      tarih: simdi,
      suSicakligi: k.suSicakligi,
      dalga: k.dalga,
      dalgaPeriyodu: k.dalgaPeriyodu,
      ruzgarHizi: k.ruzgarHizi,
      ruzgarYonu: k.ruzgarYonu,
      ruzgarHamlesi: k.ruzgarHamlesi,
      basincEgilimi: k.basincEgilimi,
      bulut: k.bulut,
      yagis: k.yagis,
      gunDogumu: k.gunDogumu,
      gunBatimi: k.gunBatimi,
      kiyiYonu: nokta.kiyiYonu,
    };

    const adaylar = veri.turler.filter((t) => nokta.turler.includes(t.id));
    const sirali = turleriSirala(adaylar, kosul).slice(0, 6);

    if (listeAlani) {
      listeAlani.innerHTML = sirali.length
        ? sirali.map(({ tur, sonuc }) => turSatiri(tur as PanelTuru, sonuc)).join('')
        : '<li class="kart p-4 text-sm text-muted">Bu nokta için tür kaydı yok.</li>';
    }

    // --- Karar kartı: listenin başındaki tür ---
    if (kararAlani) {
      const en = sirali[0];
      kararAlani.innerHTML = en
        ? kararKarti(
            en.tur as PanelTuru, en.sonuc, nokta, k.gunBatimi,
            sirali.slice(1, 3).map((o) => ({ tur: o.tur as PanelTuru, sonuc: o.sonuc })),
          )
        : '';
    }

    // --- Uyarılar ---
    const uyarilar = new Set<string>();
    for (const { sonuc } of sirali) for (const u of sonuc.uyarilar) uyarilar.add(u);
    if (typeof k.ruzgarYonu === 'number') {
      const iliski = kiyiIliskisi(k.ruzgarYonu, nokta.kiyiYonu);
      if (iliski === 'denizden' && (k.ruzgarHizi ?? 0) > 25) uyarilar.add(KIYI_ILISKISI_METNI.denizden);
    }
    if (typeof k.gorus === 'number' && k.gorus < 2000) {
      uyarilar.add(`Görüş mesafesi ${Math.round(k.gorus)} m — sis var. Deniz trafiğinin yoğun olduğu Boğaz kıyısında dikkatli ol.`);
    }
    if (typeof k.uv === 'number' && k.uv >= 6) {
      uyarilar.add(`UV indeksi ${Math.round(k.uv)} — şapka, gözlük ve güneş koruyucu olmadan uzun süre mendirekte kalma.`);
    }
    if (typeof k.denizSeviyesiSapmasi === 'number' && k.denizSeviyesiSapmasi > 0.2) {
      uyarilar.add(`Deniz seviyesi normalin ${Math.round(k.denizSeviyesiSapmasi * 100)} cm üstünde. Alçak mendirek ve kayalıklar su altında kalabilir.`);
    }
    if (r?.id === 'lodos' && (k.ruzgarHizi ?? 0) >= 25) {
      uyarilar.add('Kuvvetli lodos: Boğaz koylarında orkoz (ters akıntı) olasılığı yüksek. Yem sürüklenme yönünü atıştan önce gözle kontrol et.');
    }
    if (uyariAlani) {
      uyariAlani.innerHTML = uyarilar.size
        ? `<div class="rounded-sm border-2 border-warn/45 bg-warn-soft p-4 text-sm">
             <p class="flex items-center gap-1.5 font-semibold text-warn">${ikonSvg('uyari', 'size-4')}Dikkat</p>
             <ul class="mt-1.5 list-disc space-y-1 pl-5">${[...uyarilar].map((u) => `<li>${kacir(u)}</li>`).join('')}</ul>
           </div>`
        : '';
    }

    statikAlan?.setAttribute('hidden', '');
    canliAlanlar.forEach((e) => e.removeAttribute('hidden'));
    const yas = Date.now() - paket.guncelleme;
    const bayat = yas > ONBELLEK_SURESI_MS;
    // Bayat veriyi gizlemiyoruz: kullanıcı kaç saat önceki tahmine baktığını
    // bilmeli. Damga yenile düğmesinin yanında durduğu için "ne kadar taze" ile
    // "tazele" aynı yerde.
    damgaYaz(
      bayat
        ? `${gecenSureMetni(yas)} alındı`
        : `${saatMetni(new Date(paket.guncelleme))} itibarıyla`,
      bayat,
    );

    if (durumMetni) {
      const eksikDeniz = paket.eksik.includes('deniz');
      const denizYok = eksikDeniz || k.suSicakligi === null || k.dalga === null;
      // Paket tazelik sınırını aşmışsa `havaGetir` ağa çıkmayı denemiş ve
      // başarısız olmuştur — yani bu ibare her koşulda doğru.
      const notlar = [
        bayat ? 'Servise şu an ulaşılamıyor, en son alınan tahmin gösteriliyor.' : '',
        denizYok
          ? (nokta.tatliSu
            ? 'Tatlı su: deniz modeli göl ve dereleri kapsamıyor, skorlar dalga ve su sıcaklığı olmadan hesaplandı.'
            : nokta.denizVerisiZayif
              ? 'Deniz modeli bu kapalı suyu kapsamıyor, skorlar dalga ve su sıcaklığı olmadan hesaplandı.'
              : 'Dalga ve su sıcaklığı verisi alınamadı.')
          : '',
      ].filter(Boolean);
      durumMetni.className = bayat ? 'mt-2 text-sm text-warn' : 'mt-2 text-sm text-muted';
      durumMetni.textContent = notlar.join(' ');
      // Söyleyecek bir şey yoksa boş bir satır bırakmıyoruz.
      durumMetni.hidden = notlar.length === 0;
    }
  }

  ilSecici?.addEventListener('change', () => {
    const il = ilSecici.value;
    noktalariDaralt(il);
    if (secici) {
      secici.selectedIndex = 0;         // yeni ilin ilk noktasına geç
      seciliId = secici.value;
      try {
        localStorage.setItem(IL_ANAHTARI, il);
        localStorage.setItem(SECIM_ANAHTARI, seciliId);
      } catch { /* yoksay */ }
      void yukle();
    }
  });

  secici?.addEventListener('change', () => {
    seciliId = secici.value;
    try { localStorage.setItem(SECIM_ANAHTARI, seciliId); } catch { /* yoksay */ }
    void yukle();
  });
  // --- Konumuma en yakın nokta ---
  // Panelin ilk sorusu "neredesin". Konum yalnızca bu düğmeye basılınca istenir;
  // izin verilmezse seçiciler tek başına çalışmaya devam eder.
  const enYakinDugmesi = kok.querySelector<HTMLButtonElement>('[data-en-yakin]');
  const konumDurumu = kok.querySelector<HTMLElement>('[data-konum-durum]');

  /** Kapsam alanının dışındaysan en yakın nokta yine de çok uzak olabilir. */
  const KAPSAM_UZAKLIGI_KM = 100;

  function konumNotu(metin: string, tur: 'bilgi' | 'uyari'): void {
    if (!konumDurumu) return;
    konumDurumu.className = tur === 'uyari' ? 'mt-2 text-sm text-warn' : 'mt-2 text-sm text-muted';
    konumDurumu.textContent = metin;
    konumDurumu.hidden = false;
  }

  if (enYakinDugmesi && konumDestekli()) {
    enYakinDugmesi.hidden = false;
    enYakinDugmesi.addEventListener('click', async () => {
      enYakinDugmesi.disabled = true;
      enYakinDugmesi.setAttribute('aria-busy', 'true');
      konumNotu('Konum alınıyor…', 'bilgi');

      try {
        const konum = await konumAl();
        let enYakin = veri.noktalar[0]!;
        let enKisa = Infinity;
        for (const n of veri.noktalar) {
          const uzaklik = mesafeKm(konum.lat, konum.lng, n.lat, n.lng);
          if (uzaklik < enKisa) { enKisa = uzaklik; enYakin = n; }
        }

        seciliId = enYakin.id;
        if (ilSecici) {
          ilSecici.value = enYakin.il;
          noktalariDaralt(enYakin.il);
        }
        if (secici) secici.value = enYakin.id;
        try {
          localStorage.setItem(IL_ANAHTARI, enYakin.il);
          localStorage.setItem(SECIM_ANAHTARI, enYakin.id);
        } catch { /* önbelleksiz devam */ }

        konumNotu(
          enKisa > KAPSAM_UZAKLIGI_KM
            ? `En yakın kayıtlı nokta ${enYakin.ad}, sana ${mesafeMetni(enKisa)} uzaklıkta.`
              + ' Rehberin kapsamı İstanbul ve Kocaeli kıyısı ile Sapanca çevresindeki iç sular.'
            : `${enYakin.ad} seçildi — sana ${mesafeMetni(enKisa)} uzaklıkta.`,
          enKisa > KAPSAM_UZAKLIGI_KM ? 'uyari' : 'bilgi',
        );
        await yukle();
      } catch (hata) {
        konumNotu(konumHataMetni(hata), 'uyari');
      } finally {
        enYakinDugmesi.disabled = false;
        enYakinDugmesi.removeAttribute('aria-busy');
      }
    });
  }

  yenileDugmesi?.addEventListener('click', () => void yukle(true));

  // Bağlantı geri geldiğinde bayat paneli kendiliğinden tazele.
  aktifYukle = yukle;
  if (!cevrimiciBagli) {
    cevrimiciBagli = true;
    addEventListener('online', () => { void aktifYukle?.(true); });
  }

  void yukle();
}
