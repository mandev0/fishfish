/**
 * Nokta haritası ve filtreler.
 *
 * Harita bir bonustur: Leaflet yüklenmezse veya OpenStreetMap karoları
 * gelmezse harita alanı gizlenir, altındaki liste ve filtreler
 * hiçbir şey kaybetmeden çalışmaya devam eder.
 */

import { konumAl, konumDestekli, konumHataMetni, type Konum } from '../../lib/konum';
import { baslikBicimi } from '../../lib/metin';
import { mesafeKm, mesafeMetni } from '../../lib/mesafe';

interface Nokta {
  id: string; ad: string; il: string; bolge: string; su: string; yontemler: string[];
  /** İdari ilçe ve onun bağlı olduğu yaka; yakası olmayan ilçelerde boş. */
  ilce: string; yaka: string;
  lat: number; lng: number; turler: string[]; tip: string[];
  geceIsigi: boolean; otopark: string; ozet: string;
}

/** Bölge rengini CSS jetonundan okur; harita ile kartlar hep aynı renkte kalır. */
function bolgeRengi(bolge: string): string {
  const deger = getComputedStyle(document.documentElement)
    .getPropertyValue(`--bolge-${bolge}`).trim();
  return deger || getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0b4f66';
}

/** Dokunmatik cihaz mı? (İşaretçi kaba ise tek parmak sayfayı kaydırmalı.) */
const dokunmatik = typeof matchMedia === 'function'
  && matchMedia('(hover: none) and (pointer: coarse)').matches;

/**
 * Gömülü haritalarda sayfa kaydırmayı çalmamak için yerleşik davranış:
 *   masaüstü — düz tekerlek sayfayı kaydırır, Ctrl/⌘ + tekerlek haritayı yakınlaştırır
 *   dokunmatik — tek parmak sayfayı kaydırır, iki parmak haritayı gezdirir
 * Kullanıcı "yanlış" jesti denediğinde ne yapması gerektiğini söyleyen bir katman beliriyor.
 */
function jestleriBagla(harita: any, kap: HTMLElement): void {
  const ipucu = document.createElement('div');
  ipucu.className = 'harita-ipucu';
  ipucu.setAttribute('aria-hidden', 'true');
  ipucu.textContent = dokunmatik
    ? 'Haritayı gezdirmek için iki parmak kullan'
    : 'Yakınlaştırmak için Ctrl tuşuyla birlikte kaydır';
  kap.appendChild(ipucu);

  let zamanlayici: ReturnType<typeof setTimeout> | undefined;
  const goster = () => {
    ipucu.dataset.acik = '';
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => delete ipucu.dataset.acik, 1600);
  };

  kap.addEventListener('wheel', (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const nokta = harita.mouseEventToContainerPoint(e);
      // deltaY yukarı negatif: yukarı kaydırma yakınlaştırır.
      harita.setZoomAround(
        harita.containerPointToLatLng(nokta),
        harita.getZoom() - Math.sign(e.deltaY) * 0.6,
      );
      delete ipucu.dataset.acik;
    } else {
      goster();  // sayfa normal şekilde kaymaya devam eder
    }
  }, { passive: false });

  if (dokunmatik) {
    kap.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        harita.dragging.enable();
        delete ipucu.dataset.acik;
      } else {
        harita.dragging.disable();
        goster();
      }
    }, { passive: true });
    kap.addEventListener('touchend', (e: TouchEvent) => {
      if (e.touches.length < 2) harita.dragging.disable();
    }, { passive: true });
  }

  // Klavye erişilebilirliği: harita odaktayken +/- ve ok tuşları Leaflet tarafından zaten yönetiliyor.
  kap.setAttribute('tabindex', '0');
  kap.setAttribute('role', 'application');
  kap.setAttribute('aria-label', 'Balık tutma noktaları haritası');
}

export async function baslat(): Promise<void> {
  const veriEtiketi = document.getElementById('nokta-verisi');
  if (!veriEtiketi?.textContent) return;
  const noktalar: Nokta[] = JSON.parse(veriEtiketi.textContent);

  const turSecici = document.querySelector<HTMLSelectElement>('[data-tur-filtre]');
  const ilSecici = document.querySelector<HTMLSelectElement>('[data-il-filtre]');
  const bolgeSecici = document.querySelector<HTMLSelectElement>('[data-bolge-filtre]');
  const isikKutusu = document.querySelector<HTMLInputElement>('[data-isik-filtre]');
  const suSecici = document.querySelector<HTMLSelectElement>('[data-su-filtre]');
  const yontemSecici = document.querySelector<HTMLSelectElement>('[data-yontem-filtre]');
  // Yaka ve ilçe birden fazla seçilebildiği için çip; seçim `aria-pressed`'te durur.
  const yakaCipleri = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-yaka][data-il]:not([data-ilce])'));
  const ilceCipleri = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-ilce]'));
  const sifirlaDugmesi = document.querySelector<HTMLButtonElement>('[data-filtre-sifirla]');
  const sayac = document.querySelector<HTMLElement>('[data-sayac]');
  const filtreRozeti = document.querySelector<HTMLElement>('[data-filtre-rozeti]');
  const kartlar = Array.from(document.querySelectorAll<HTMLElement>('[data-nokta-id]'));

  let isaretciler: Record<string, any> = {};
  let harita: any = null;
  /** Konuma göre sıralama açıkken kullanıcının yeri; çerçeve buna da uyar. */
  let kullaniciKonumu: Konum | null = null;
  let kullaniciIsaretcisi: any = null;
  /** Harita kurulunca gerçek gövdesiyle değiştirilir. */
  let cerceveyeSigdir: () => void = () => {};

  /** Basılı çiplerin değerleri; hiçbiri basılı değilse süzgeç kapalıdır. */
  const secili = (cipler: HTMLButtonElement[], alan: 'yaka' | 'ilce') =>
    cipler.filter((c) => c.getAttribute('aria-pressed') === 'true')
      .map((c) => c.dataset[alan]!)
      .filter(Boolean);

  function gorunur(n: Nokta): boolean {
    if (ilSecici?.value && n.il !== ilSecici.value) return false;
    const yakalar = secili(yakaCipleri, 'yaka');
    if (yakalar.length && !yakalar.includes(n.yaka)) return false;
    const ilceler = secili(ilceCipleri, 'ilce');
    if (ilceler.length && !ilceler.includes(n.ilce)) return false;
    // Su türü seçenekleri, sunucuda basılan <option value> içinde su alanı
    // kimliklerini taşır: "bogaz marmara ..." gibi boşlukla ayrılmış liste.
    if (suSecici?.value && !suSecici.value.split(' ').includes(n.su)) return false;
    if (yontemSecici?.value && !n.yontemler.includes(yontemSecici.value)) return false;
    if (turSecici?.value && !n.turler.includes(turSecici.value)) return false;
    if (bolgeSecici?.value && n.bolge !== bolgeSecici.value) return false;
    if (isikKutusu?.checked && !n.geceIsigi) return false;
    return true;
  }

  /**
   * İl seçilince bölge listesini o ile daraltır.
   * Seçili bölge artık o ile ait değilse seçim "Hepsi"ye döner — yoksa
   * kullanıcı hiçbir sonuç vermeyen bir kombinasyonda kalıyor.
   */
  const bolgeSecenekleri = bolgeSecici ? [...bolgeSecici.querySelectorAll('option')] : [];
  // Seçimi ayrı tutuyoruz: DOM'dan çıkarılan bir <option> kendi `selected`
  // durumunu koruyor ve geri eklendiğinde sessizce yeniden seçili hale geliyor.
  // Bu yüzden değeri her daraltmadan sonra açıkça geri yazıyoruz.
  let seciliBolge = bolgeSecici?.value ?? '';

  function bolgeleriDaralt(): void {
    if (!bolgeSecici) return;
    const il = ilSecici?.value ?? '';

    // Seçili bölge yeni ile ait değilse seçimi bırak.
    const seciliSecenek = bolgeSecenekleri.find((o) => o.value === seciliBolge);
    if (seciliBolge && il && seciliSecenek?.dataset.il !== il) seciliBolge = '';

    for (const secenek of bolgeSecenekleri) {
      if (!secenek.value) continue;                       // "Hepsi" her zaman kalır
      const uygun = !il || secenek.dataset.il === il;
      if (uygun && !secenek.parentNode) bolgeSecici.appendChild(secenek);
      else if (!uygun && secenek.parentNode) secenek.remove();
    }
    // Yeniden eklenenler sona gittiği için özgün sıraya döndürüyoruz.
    for (const secenek of bolgeSecenekleri) {
      if (secenek.parentNode) bolgeSecici.appendChild(secenek);
    }

    bolgeSecici.value = [...bolgeSecici.options].some((o) => o.value === seciliBolge)
      ? seciliBolge
      : '';
    seciliBolge = bolgeSecici.value;
  }

  function uygula(): void {
    let sayi = 0;
    for (const n of noktalar) {
      const g = gorunur(n);
      if (g) sayi++;
      const kart = kartlar.find((k) => k.dataset.noktaId === n.id);
      if (kart) kart.hidden = !g;
      const isaretci = isaretciler[n.id];
      if (isaretci && harita) {
        if (g) isaretci.addTo(harita);
        else harita.removeLayer(isaretci);
      }
    }
    if (sayac) sayac.textContent = `${sayi} nokta gösteriliyor`;

    // Panel dar ekranda kapalıyken kaç filtrenin açık olduğu başlıktan okunsun.
    // Yaka ve ilçe çok seçimli; her biri kaç çip basılı olursa olsun tek filtre sayılır.
    const aktif = [
      ilSecici?.value, bolgeSecici?.value, turSecici?.value,
      suSecici?.value, yontemSecici?.value,
    ].filter(Boolean).length
      + (isikKutusu?.checked ? 1 : 0)
      + (secili(yakaCipleri, 'yaka').length ? 1 : 0)
      + (secili(ilceCipleri, 'ilce').length ? 1 : 0);

    if (filtreRozeti) {
      filtreRozeti.textContent = aktif ? baslikBicimi(`${aktif} filtre`) : '';
      filtreRozeti.hidden = aktif === 0;
    }
    // Çok seçimli çiplerle sonuçsuz bir kombinasyonda kalmak kolay; çıkış yolu görünür olsun.
    if (sifirlaDugmesi) sifirlaDugmesi.hidden = aktif === 0;
  }

  /**
   * Adres satırından gelen ön seçim (`/noktalar?yontem=lrf`).
   *
   * Yöntem sayfası ve hava paneli buraya bu bağlantıyla yönlendiriyor:
   * kullanıcı bir yöntem seçtiyse nokta listesi de o yönteme göre açılsın.
   * Bilinmeyen değer sessizce yok sayılır — filtre "Hepsi" kalır.
   */
  function adrestenSec(): void {
    const adres = new URLSearchParams(location.search);
    let secildi = false;

    const yontem = adres.get('yontem');
    if (yontem && yontemSecici && [...yontemSecici.options].some((o) => o.value === yontem)) {
      yontemSecici.value = yontem;
      secildi = true;
    }

    // Nokta sayfasındaki ilçe bağlantısı buraya düşer.
    const ilce = adres.get('ilce');
    if (ilce) {
      const cip = ilceCipleri.find((c) => c.dataset.ilce === ilce);
      if (cip) {
        cip.setAttribute('aria-pressed', 'true');
        // İl seçicisini de o ile al; yoksa çip daraltmada gizlenip seçimi düşerdi.
        if (ilSecici && cip.dataset.il) ilSecici.value = cip.dataset.il;
        secildi = true;
      }
    }

    // Filtre açıkken paneli kapalı bırakmak "hiç nokta yok" gibi görünüyordu.
    if (secildi) {
      const panel = document.querySelector<HTMLDetailsElement>('[data-filtreler]');
      if (panel) panel.open = true;
    }
  }

  /**
   * Çipleri seçili il ve yakaya göre daraltır.
   *
   * Gizlenen bir çip basılı kalırsa kullanıcı göremediği bir süzgeçle sonuçsuz
   * bir listeye bakıyor; bu yüzden gizlerken seçimi de bırakıyoruz.
   */
  function cipleriDaralt(): void {
    const il = ilSecici?.value ?? '';
    for (const cip of yakaCipleri) {
      const uygun = !il || cip.dataset.il === il;
      cip.hidden = !uygun;
      if (!uygun) cip.setAttribute('aria-pressed', 'false');
    }
    const yakalar = secili(yakaCipleri, 'yaka');
    for (const cip of ilceCipleri) {
      const uygun = (!il || cip.dataset.il === il)
        && (!yakalar.length || yakalar.includes(cip.dataset.yaka ?? ''));
      cip.hidden = !uygun;
      if (!uygun) cip.setAttribute('aria-pressed', 'false');
    }
    // Bütün çipleri gizlenen satır başlığıyla birlikte gitsin.
    for (const cipler of [yakaCipleri, ilceCipleri]) {
      const blok = cipler[0]?.parentElement?.parentElement;
      if (blok) blok.hidden = cipler.every((c) => c.hidden);
    }
  }

  for (const cip of [...yakaCipleri, ...ilceCipleri]) {
    cip.addEventListener('click', () => {
      cip.setAttribute('aria-pressed', String(cip.getAttribute('aria-pressed') !== 'true'));
      cipleriDaralt();
      uygula();
    });
  }

  sifirlaDugmesi?.addEventListener('click', () => {
    for (const secici of [ilSecici, bolgeSecici, turSecici, suSecici, yontemSecici]) {
      if (secici) secici.value = '';
    }
    seciliBolge = '';
    if (isikKutusu) isikKutusu.checked = false;
    for (const cip of [...yakaCipleri, ...ilceCipleri]) cip.setAttribute('aria-pressed', 'false');
    bolgeleriDaralt();
    cipleriDaralt();
    uygula();
  });

  ilSecici?.addEventListener('change', () => { bolgeleriDaralt(); cipleriDaralt(); uygula(); });
  turSecici?.addEventListener('change', uygula);
  bolgeSecici?.addEventListener('change', () => { seciliBolge = bolgeSecici.value; uygula(); });
  isikKutusu?.addEventListener('change', uygula);
  suSecici?.addEventListener('change', uygula);
  yontemSecici?.addEventListener('change', uygula);
  adrestenSec();
  bolgeleriDaralt();
  cipleriDaralt();
  uygula();

  konumuBagla();

  /**
   * "Konumuma göre sırala" akışı.
   *
   * Konum yalnızca düğmeye basılınca istenir. İzin verilmezse hiçbir şey
   * bozulmaz: liste alfabetik kalır, harita kapsam alanına çerçevelenir.
   */
  function konumuBagla(): void {
    const dugme = document.querySelector<HTMLButtonElement>('[data-yakin]');
    const etiket = document.querySelector<HTMLElement>('[data-yakin-etiket]');
    const durum = document.querySelector<HTMLElement>('[data-konum-durum]');
    if (!dugme) return;

    // Tarayıcı konum vermiyorsa (ya da bağlam güvenli değilse) düğmeyi hiç açma.
    if (!konumDestekli()) return;
    dugme.hidden = false;

    const kap = kartlar[0]?.parentElement ?? null;
    const ozgunSira = [...kartlar];

    function etiketiYaz(metin: string): void {
      if (etiket) etiket.textContent = metin;
    }

    function durumuYaz(metin: string | null): void {
      if (!durum) return;
      durum.textContent = metin ?? '';
      durum.hidden = !metin;
    }

    function mesafeleriGoster(konum: Konum): void {
      const sirali = [...ozgunSira].sort((a, b) => {
        const na = noktalar.find((n) => n.id === a.dataset.noktaId);
        const nb = noktalar.find((n) => n.id === b.dataset.noktaId);
        if (!na || !nb) return 0;
        return mesafeKm(konum.lat, konum.lng, na.lat, na.lng)
          - mesafeKm(konum.lat, konum.lng, nb.lat, nb.lng);
      });
      for (const kart of sirali) {
        const n = noktalar.find((x) => x.id === kart.dataset.noktaId);
        const cip = kart.querySelector<HTMLElement>('[data-mesafe]');
        if (n && cip) {
          cip.textContent = mesafeMetni(mesafeKm(konum.lat, konum.lng, n.lat, n.lng));
          cip.hidden = false;
        }
        kap?.appendChild(kart);
      }
    }

    function mesafeleriGizle(): void {
      for (const kart of ozgunSira) {
        const cip = kart.querySelector<HTMLElement>('[data-mesafe]');
        if (cip) { cip.textContent = ''; cip.hidden = true; }
        kap?.appendChild(kart);
      }
    }

    function kullaniciyiIsaretle(L: any): void {
      if (!harita || !kullaniciKonumu) return;
      kullaniciIsaretcisi?.remove();
      kullaniciIsaretcisi = L.circleMarker([kullaniciKonumu.lat, kullaniciKonumu.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 3,
        fillColor: getComputedStyle(document.documentElement).getPropertyValue('--vurgu').trim() || '#d4711f',
        fillOpacity: 1,
      }).addTo(harita);
      kullaniciIsaretcisi.bindTooltip('Buradasın', { direction: 'top', offset: [0, -10] });
    }

    dugme.addEventListener('click', async () => {
      if (kullaniciKonumu) {
        // Alfabetik sıraya dön.
        kullaniciKonumu = null;
        kullaniciIsaretcisi?.remove();
        kullaniciIsaretcisi = null;
        mesafeleriGizle();
        etiketiYaz('Konumuma Göre Sırala');
        durumuYaz(null);
        cerceveyeSigdir();
        return;
      }

      dugme.disabled = true;
      etiketiYaz('Konum Alınıyor…');
      durumuYaz(null);
      try {
        const konum = await konumAl();
        kullaniciKonumu = konum;
        mesafeleriGoster(konum);
        etiketiYaz('Alfabetik sırala');
        if (harita) {
          const L = (await import('leaflet')).default;
          kullaniciyiIsaretle(L);
        }
        cerceveyeSigdir();
      } catch (hata) {
        durumuYaz(konumHataMetni(hata));
        etiketiYaz('Konumuma göre sırala');
      } finally {
        dugme.disabled = false;
      }
    });
  }

  // --- Harita (yüklenemezse sessizce vazgeç) ---
  const kap = document.getElementById('harita');
  if (!kap) return;
  try {
    const L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    // Kabı ölçülebilir hale getirmeden harita kurma: gizli bir kap 0×0'dır ve
    // fitBounds anlamsız bir yakınlaştırma hesaplar.
    kap.classList.remove('hidden');

    harita = L.map(kap, {
      scrollWheelZoom: false,   // sayfa kaydırmayı çalmasın; aşağıda Ctrl/⌘ ile açıyoruz
      dragging: !dokunmatik,    // dokunmatikte tek parmak sayfayı kaydırsın
      touchZoom: true,
    }).setView([41.0, 29.4], 9);

    jestleriBagla(harita, kap);
    let karoGeldi = false;
    const karolar = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap katkıcıları',
    });
    karolar.on('tileload', () => { karoGeldi = true; });
    karolar.addTo(harita);

    // Karo sunucusuna hiç erişilemediyse gri bir kutu bırakmak yerine durumu söyle.
    setTimeout(() => {
      if (karoGeldi) return;
      harita?.remove();
      harita = null;
      kap.classList.add('hidden');
      const not = document.createElement('p');
      not.className = 'mt-4 rounded-sm border-2 border-line bg-surface-2 p-4 text-sm text-muted';
      not.textContent = 'Harita karoları yüklenemedi (bağlantı yok olabilir). Aşağıdaki liste ve filtreler çalışmaya devam ediyor.';
      kap.insertAdjacentElement('afterend', not);
    }, 6000);

    for (const n of noktalar) {
      const renk = bolgeRengi(n.bolge);
      const m = L.circleMarker([n.lat, n.lng], {
        radius: 6,
        color: renk,
        fillColor: renk,
        fillOpacity: 0.8,
        weight: 2,
      });
      m.bindPopup(
        `<strong>${n.ad}</strong><br>${n.ozet}<br>`
        + `<a href="/nokta/${n.id}">Nokta Sayfası →</a>`,
      );
      m.bindTooltip(n.ad, { direction: 'top', offset: [0, -8] });
      isaretciler[n.id] = m;
    }
    uygula();

    /**
     * Görünen noktaları kapsayacak şekilde çerçeveyi ayarlar.
     * Konuma göre sıralama açıkken kullanıcının yeri ile en yakın beş noktayı
     * çerçeveler: 59 noktanın tamamını kapsayan bir çerçeve "yakınımdakiler"
     * sorusuna cevap vermiyor.
     */
    cerceveyeSigdir = () => {
      if (!harita) return;
      const gorunenNoktalar = noktalar.filter(gorunur);
      if (!gorunenNoktalar.length) return;

      if (kullaniciKonumu) {
        const enYakin = [...gorunenNoktalar]
          .sort((a, b) =>
            mesafeKm(kullaniciKonumu!.lat, kullaniciKonumu!.lng, a.lat, a.lng)
            - mesafeKm(kullaniciKonumu!.lat, kullaniciKonumu!.lng, b.lat, b.lng))
          .slice(0, 5)
          .map((n) => [n.lat, n.lng] as [number, number]);
        harita.fitBounds([[kullaniciKonumu.lat, kullaniciKonumu.lng], ...enYakin],
          { padding: [30, 30], maxZoom: 13 });
        return;
      }

      harita.fitBounds(gorunenNoktalar.map((n) => [n.lat, n.lng] as [number, number]),
        { padding: [26, 26], maxZoom: 13 });
    };

    // Kap görünür olduktan sonra gerçek boyutuyla ölçüp çerçeveyi kur.
    // Sabit merkez yerine bunu kullanıyoruz: kapsam alanı büyüdükçe
    // (İstanbul → Kocaeli) haritayı elle ayarlamak gerekmiyor.
    setTimeout(() => {
      harita.invalidateSize();
      cerceveyeSigdir();
    }, 80);

    for (const secici of [ilSecici, turSecici, bolgeSecici, suSecici, yontemSecici]) {
      secici?.addEventListener('change', cerceveyeSigdir);
    }
    isikKutusu?.addEventListener('change', cerceveyeSigdir);
  } catch {
    kap.remove();
  }
}
