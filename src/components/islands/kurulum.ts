/**
 * "Ana ekrana ekle" kartı.
 *
 * Sunucu kartı elle kurulum yönergeleriyle basar — JavaScript kapalıyken de
 * okunur. Tarayıcı gerçek bir kurulum istemi sunuyorsa (Chrome/Edge) yönergenin
 * yerini tek düğme alır. iOS'ta böyle bir istem yok, yönerge kalır.
 *
 * Uygulama zaten ana ekrandan açılmışsa kart tümden gizlenir.
 */

interface KurulumOlayi extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let bekleyenIstem: KurulumOlayi | null = null;
let kuruldu = false;

/** Kart her sayfa geçişinde yeniden basılır; görünürlüğü duruma göre ayarlanır. */
function tazele(): void {
  const kok = document.getElementById('kurulum');
  if (!kok) return;

  const uygulamaOlarak = matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (uygulamaOlarak) {
    kok.hidden = true;
    return;
  }

  const dugme = kok.querySelector<HTMLElement>('[data-kur]');
  const elle = kok.querySelector<HTMLElement>('[data-elle]');
  if (dugme) dugme.hidden = !bekleyenIstem;
  if (elle) elle.hidden = !!bekleyenIstem;
}

export function baslat(): void {
  const kok = document.getElementById('kurulum');
  if (!kok) return;
  tazele();

  kok.querySelector<HTMLButtonElement>('[data-kur]')?.addEventListener('click', async () => {
    if (!bekleyenIstem) return;
    await bekleyenIstem.prompt();
    await bekleyenIstem.userChoice;
    // İstem tek kullanımlık: kullanıldıktan sonra yönergeye geri döneriz.
    bekleyenIstem = null;
    tazele();
  });

  if (kuruldu) return;
  kuruldu = true;

  addEventListener('beforeinstallprompt', (olay) => {
    // Varsayılan çubuğu engelleyip istemi kendi düğmemize saklıyoruz.
    olay.preventDefault();
    bekleyenIstem = olay as KurulumOlayi;
    tazele();
  });

  addEventListener('appinstalled', () => {
    bekleyenIstem = null;
    const k = document.getElementById('kurulum');
    if (k) k.hidden = true;
  });
}
