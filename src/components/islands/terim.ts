/**
 * Terim balonu.
 *
 * Masaüstü: terimin üstüne gelince veya odaklanınca yanında bir balon açılır.
 * Dokunmatik: ekranın altından bir panel çıkar — parmakla okunabilir boyutta,
 *   arkası perdeli, kapatması kolay. Üstüne gelme diye bir jest olmadığı için
 *   telefonda balon konumlandırmaya çalışmıyoruz.
 * Escape her zaman kapatır.
 *
 * `baslat()` her sayfa yüklemesinde yeniden çağrılır (sayfa geçişlerinde DOM
 * değişiyor); `document` üzerindeki dinleyiciler yalnızca bir kez bağlanır.
 */

interface Kayit { id: string; ad: string; ozet: string; href?: string; kaynak: string }

const DOKUNMATIK = typeof matchMedia === 'function'
  && matchMedia('(hover: none) and (pointer: coarse)').matches;

/** Sayfa geçişlerinde yenilenen DOM referansları. */
interface Durum {
  balon: HTMLElement;
  perde: HTMLElement | null;
  ad: HTMLElement;
  ozet: HTMLElement;
  bag: HTMLAnchorElement;
  kapat: HTMLButtonElement;
  sozluk: Record<string, Kayit>;
}

let d: Durum | null = null;
let kuruldu = false;
let acikTetik: HTMLElement | null = null;
let acmaZamani: ReturnType<typeof setTimeout> | undefined;
let kapamaZamani: ReturnType<typeof setTimeout> | undefined;

function kapat(): void {
  clearTimeout(acmaZamani);
  if (d) {
    d.balon.hidden = true;
    if (d.perde) d.perde.hidden = true;
  }
  if (DOKUNMATIK) document.body.style.overflow = '';
  acikTetik?.removeAttribute('aria-expanded');
  acikTetik?.removeAttribute('aria-describedby');
  acikTetik = null;
}

function konumlandir(tetik: HTMLElement): void {
  if (!d || DOKUNMATIK) return;
  const b = d.balon;
  b.style.left = '0px';
  b.style.top = '0px';
  const t = tetik.getBoundingClientRect();
  const o = b.getBoundingClientRect();
  const bosluk = 8;

  let sol = t.left + t.width / 2 - o.width / 2;
  sol = Math.max(bosluk, Math.min(sol, window.innerWidth - o.width - bosluk));

  // Üstte yer varsa üstte, yoksa altta aç.
  const ustte = t.top > o.height + bosluk * 2;
  const ust = ustte ? t.top - o.height - bosluk : t.bottom + bosluk;

  b.style.left = `${Math.round(sol)}px`;
  b.style.top = `${Math.round(ust)}px`;
  b.dataset.yon = ustte ? 'ust' : 'alt';
}

function ac(tetik: HTMLElement): void {
  if (!d) return;
  // İki kaynak: sözlük/ekipman terimi (data-terim) veya düz metin ipucu (data-ipucu).
  const duzMetin = tetik.dataset.ipucu;
  const kayit: Kayit | undefined = duzMetin
    ? { id: 'ipucu', ad: '', ozet: duzMetin, kaynak: 'ipucu' }
    : d.sozluk[tetik.dataset.terim ?? ''];
  if (!kayit) return;
  clearTimeout(kapamaZamani);

  d.ad.textContent = kayit.ad;
  d.ad.hidden = !kayit.ad;
  d.ozet.textContent = kayit.ozet;
  if (kayit.href) {
    d.bag.href = kayit.href;
    d.bag.hidden = false;
  } else {
    d.bag.hidden = true;
  }
  // Kapat düğmesi yalnızca dokunmatikte gerekli: masaüstünde fare çekilince kapanıyor.
  d.kapat.hidden = !DOKUNMATIK;

  d.balon.hidden = false;
  if (DOKUNMATIK) {
    // Panel açıkken arkadaki sayfa kaymasın.
    if (d.perde) d.perde.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  tetik.setAttribute('aria-expanded', 'true');
  tetik.setAttribute('aria-describedby', 'terim-balonu');
  acikTetik = tetik;
  konumlandir(tetik);
}

function tetikMi(hedef: EventTarget | null): HTMLElement | null {
  return (hedef instanceof Element
    ? hedef.closest<HTMLElement>('.terim, [data-ipucu]')
    : null);
}

export function baslat(): void {
  const balon = document.getElementById('terim-balonu');
  const veri = document.getElementById('terim-verisi');
  if (!balon || !veri?.textContent) return;

  d = {
    balon,
    perde: document.getElementById('terim-perde'),
    ad: balon.querySelector<HTMLElement>('.terim-balon-ad')!,
    ozet: balon.querySelector<HTMLElement>('.terim-balon-ozet')!,
    bag: balon.querySelector<HTMLAnchorElement>('.terim-balon-bag')!,
    kapat: balon.querySelector<HTMLButtonElement>('.terim-balon-kapat')!,
    sozluk: JSON.parse(veri.textContent) as Record<string, Kayit>,
  };
  // Dokunmatikte alttan çıkan panel, masaüstünde imlecin yanındaki balon.
  balon.dataset.mod = DOKUNMATIK ? 'sayfa' : 'balon';

  // Sunucu, JavaScript kapalıyken de açıklama görünsün diye rozetlere `title` basıyor.
  // Kendi balonumuz devreye girdiğinde iki açıklama üst üste çıkmasın diye kaldırıyoruz.
  for (const el of document.querySelectorAll<HTMLElement>('[data-ipucu][title]')) {
    el.removeAttribute('title');
  }

  // Bu düğme ve perde her sayfa geçişinde yenilenir, dinleyicileri her seferinde bağlanır.
  d.kapat.addEventListener('click', () => {
    const t = acikTetik;
    kapat();
    t?.focus();
  });
  d.perde?.addEventListener('click', () => kapat());

  acikTetik = null;
  kapat();

  if (kuruldu) return;
  kuruldu = true;

  document.addEventListener('click', (e) => {
    const tetik = tetikMi(e.target);
    if (tetik) {
      e.preventDefault();
      if (acikTetik === tetik) kapat();
      else ac(tetik);
      return;
    }
    if (d && !d.balon.hidden && !d.balon.contains(e.target as Node)) kapat();
  });

  if (!DOKUNMATIK) {
    document.addEventListener('mouseover', (e) => {
      const tetik = tetikMi(e.target);
      if (!tetik || tetik === acikTetik) return;
      clearTimeout(acmaZamani);
      acmaZamani = setTimeout(() => ac(tetik), 120);
    });
    document.addEventListener('mouseout', (e) => {
      const tetik = tetikMi(e.target);
      if (!tetik) return;
      clearTimeout(acmaZamani);
      // Fare balonun üstüne geçiyorsa kapatma (bağlantıya tıklanabilsin).
      kapamaZamani = setTimeout(() => {
        if (d && !d.balon.matches(':hover')) kapat();
      }, 160);
    });
    document.addEventListener('mouseleave', (e) => {
      if (d && e.target === d.balon) kapat();
    }, true);
  }

  document.addEventListener('focusin', (e) => {
    const tetik = tetikMi(e.target);
    if (tetik) {
      // Yalnızca klavyeyle odaklanınca aç. Fare/dokunmayla odaklanırsa açmayız:
      // hemen ardından gelen click olayı balonu kapatır ve balon hiç görünmez.
      if (tetik.matches(':focus-visible')) ac(tetik);
      return;
    }
    if (d && !d.balon.contains(e.target as Node)) kapat();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && d && !d.balon.hidden) {
      const t = acikTetik;
      kapat();
      t?.focus();
    }
  });

  // Sayfa geçişine girerken açık panel kalmasın.
  document.addEventListener('astro:before-swap', () => kapat());

  addEventListener('scroll', () => { if (acikTetik) konumlandir(acikTetik); }, { passive: true });
  addEventListener('resize', () => { if (acikTetik) konumlandir(acikTetik); });
}
