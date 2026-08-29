# fishfish — proje kuralları

Kıyı ve tatlı su balıkçılığı rehberi. Statik Astro sitesi; backend, veritabanı ve API anahtarı yok.
Hedef okuyucu **yeni başlayan bir hobi balıkçısı** — her açıklama bunu varsayarak yazılır.

**Kapsanan alan: İstanbul, Kocaeli ve Sakarya.** Deniz tarafı Boğaz, Marmara, Karadeniz kıyısı,
Adalar ve İzmit Körfezi; tatlı su tarafı Sapanca Gölü, Sakarya iç suları (Sakarya Nehri,
Poyrazlar, Taşkısığı) ve İstanbul dereleri. Her noktanın açık bir `il` alanı vardır; bölge adından
string ayrıştırarak il çıkarma. Yeni bir il/bölge eklerken şu yerleri birlikte güncelle,
yoksa yarım kalır: `content.config.ts` (il ve bölge enum'ları + koordinat sınırları),
`season.ts` (`IL_ADLARI`, `BOLGE_ADLARI`, `BOLGE_ILI`), `global.css` (`--bolge-*` rengi, hem
aydınlık hem koyu tema), `scripts/validate-data.mjs` (`KAPSAM_BBOX`), `scripts/fetch-shops.mjs`
(Overpass sorgusu). Metinlerdeki kapsam ifadelerini de gözden geçir — "İstanbul'da" gibi sabit
ifadeler yanlış olur.

**Bağımlı seçim kutuları** (il → bölge → nokta) `BOLGE_ILI` eşlemesine güvenir; `tests/bolge.test.ts`
bu eşlemenin veriyle çakışmadığını denetler. `validate-data.mjs` bu eşlemeyi kopyalamaz,
`season.ts`'ten okur.

**Yöntem, takım ve tür üç ayrı katmandır.** Yöntem "nasıl avlandığın" (LRF, spin, aç-çek,
yemli dip, şamandıra, çapari, egi, surf, feeder), takım "neyi bağladığın", tür "neyi
avladığın". Her takımın bir `yontem` alanı, her noktanın bir `yontemler` dizisi vardır.
**Tekneden yapılan yöntemler kapsam dışıdır** — sürütme, tekne jigi ve benzeri eklenmez;
`tests/yontem.test.ts` bunu denetler.

**Tatlı su ile deniz aynı şemayı paylaşır, ayrım `su` alanındadır.** Hangi su alanının tatlı
sayıldığı tek yerde tanımlıdır: `season.ts` içindeki `SU_TURU`. Nokta veya bölge adından
çıkarım yapma. Tatlı ve acı su noktaları `denizVerisiZayif: true` taşır (Open-Meteo deniz
modeli göl ve dereleri kapsamaz); arayüz bunu "tatlı su" diye açıklar, "kapalı su" diye değil.

---

## Dil ve yazım

- **Tüm arayüz ve içerik Türkçedir.** Kod içindeki değişken, alan ve bileşen adları da
  Türkçedir (`ruzgarHizi`, `NoktaRozetleri`, `baslikBicimi`). Karışık dil kullanma.
- **Türkçe büyük/küçük harf dönüşümünde daima `toLocaleUpperCase('tr')` /
  `toLocaleLowerCase('tr')` kullan.** JavaScript'in varsayılanı `i → I` yapar, Türkçede `i → İ`
  olmalıdır. Aynı sorun Python'da da var: `'İğne'.lower()` araya birleşen nokta (U+0307) koyar,
  metin eşleştirmede bunu temizle.
- **Bütün başlıklar başlık biçimindedir:** `<h1>`-`<h6>`, bölüm başlıkları, sekme başlığı
  (`<title>`) ve kart başlıkları. Her kelimenin ilk harfi büyük yazılır — "Yem ve Sahte Yem",
  "Nerede ve Ne Zaman", "Kurallar ve Boy Limitleri". TDK yazımına uyularak yalnızca
  **bağlaçlar** (`ve, ile, ya, veya, yahut, ki, da, de`) ve **soru eki** (`mı/mi/mu/mü`)
  küçük kalır; başlığın ilk kelimesi bunun dışındadır. Dönüşümü `src/lib/metin.ts` içindeki
  `baslikBicimi()` yapar.
  - Veriden gelen başlıklar (`{d.ad}` gibi) **render sırasında** `baslikBicimi()` ile
    sarılır; veri dosyasındaki adı büyük harfe çevirme — aynı ad cümle içinde de geçiyor.
  - `Bolum.astro`, `WeatherPanel.astro` ve `Base.astro` başlığı kendisi geçiriyor; o
    bileşenleri kullanan sayfada ekstra bir şey yapmak gerekmez.
  - `tests/baslik.test.ts` kaynaktaki sabit başlıkları denetler; cümle biçiminde bir başlık
    yazarsan test düşer.
- **Düz metin olmayan her yer başlık biçimindedir.** Başlıklara ek olarak: düğme
  etiketleri ("Konumuma Göre Sırala"), tablo sütun ve satır başlıkları ("Asgari Boy",
  "Boy Sınıfı"), form etiketleri ("Sadece Gece Aydınlatması Olanlar"), açılır bölüm
  başlıkları ("Skor Nasıl Hesaplandı?"), sekme adları, rozet ve çipler ("Çok Kolay",
  "Gece Avı", "Orta Yoğun", "1 Uyarı"). Elle büyük harfli dize yazma, `baslikBicimi()`
  kullan. Betiğin çalışma anında yazdığı etiketler de aynı biçimde olmalı
  (`spot-map.ts`, `weather-panel.ts`).
  `tests/baslik.test.ts` `<h1>`-`<h6>` yanında `<button>`, `<summary>` ve `<th>`
  içindeki sabit metinleri de denetler.
- **Cümleler, açıklamalar ve balon metinleri normal cümle biçimindedir** — yalnızca ilk harf
  büyük, sonunda nokta. Başlık biçimini cümlelere uygulama. Bölüm başlığının altındaki
  açıklama satırı (`Bolum` bileşenindeki `not`) da cümledir.
- **Şema adımları başlık değildir:** `src/components/svg/**` içindeki `baslik` alanı düğüm
  adımının cümlesidir, cümle biçiminde kalır.
- Ham veri değerini (`zor`, `kalabalik`, `sakin`) doğrudan ekrana basma; her zaman insan
  tarafından okunabilir bir etikete çevir.
- **Ondalık ayracı virgüldür** (`1,3 km`, `0,28 mm`). `toFixed()` çıktısını doğrudan ekrana
  basma; `sayiMetni()` / `mesafeMetni()` gibi biçimlendiricilerden geçir. Koordinat ve
  önbellek anahtarı gibi teknik değerler bunun dışındadır.
- **Kısa ad varyantı ayrı bir eşlemede tutulur** (`SU_ADLARI` / `SU_KISA_ADLARI`). Tam addan
  string kırparak kısaltma: "İstanbul Boğazı" → "Boğazı" gibi bozuk çekimler çıkıyor.
  Aynı gerekçe bölge → il çıkarımı için de geçerli.

### Şablon ("AI üretimi") görüntüsünden kaçınma

Aşağıdakiler kasıtlı kararlardır, geri alma:

- **Web yazı tipi yüklenmiyor** — çevrimdışı çalışma ve yeniden üretilebilir derleme
  gereği. Yüklemediğin bir yazı tipini (`"Inter"` gibi) yığına yazma: sessizce sistem
  yüzüne düşer, tek yaptığı şablon kokusu bırakmak olur.
- **Yarı saydam + bulanık çubuk yok.** Üst başlık ve alt sekme çubuğu düz zeminlidir;
  `bg-bg/95 backdrop-blur` cam efekti kaldırıldı.
- **Simge emoji değildir.** Favicon, başlıktaki logonun kendisidir (`ikonlar.ts` → `balik`),
  `Base.astro` içinde tek kaynaktan üretilir. Logo değişirse `npm run ikon:uret` ile
  PNG'leri de yenile; `scripts/ikon-uret.mjs` içindeki `ACCENT` sabiti `--accent` ile
  aynı kalmalı.
- **Gradyan, düz olmayan doku ve dekoratif gölge yok.** Ayrım çizgi, zemin tonu ve
  tipografiyle kurulur.

---

## Tasarım sistemi

Yön: **Nocturne** — claude.ai/design'dan alınan tasarım sistemi
(proje: `claude.ai/design/p/32a69d32-59c5-4f24-a3d4-b6daa6e8ee42`, ekran
`Balikcilik-Rehberi.dc.html`, yön 1b "karar kartı").

Jetonların tek kaynağı artık `global.css` içindeki `:root` bloğudur — teslim paketi
depoda tutulmuyor. Sistemi baştan değiştirmek gerekirse paketi Claude Design'dan
yeniden indir; ara düzenlemeleri doğrudan `global.css` üzerinde yap.

**Tek tema vardır.** Nocturne yalnız koyu tanımlı; açık tema, `data-theme` ve tema anahtarı
kaldırıldı. `prefers-color-scheme` sorgusu yazma.

- **Tek aksan vardır: Nocturne'ün blurple'ı** (`--accent: #9184d9`). Eylem rengi de odur
  (`--vurgu`, `--vurgu-dolgu` aynı aileden). İkinci bir vurgu rengi yok — turuncu paletten
  tamamen çıktı. `--accent-100…900` ve `--neutral-100…900` rampaları Tailwind'e de
  kayıtlıdır; `text-neutral-300` yazınca Nocturne'ün nötrü gelir, Tailwind'in kendi grisi değil.
- **Renkli sol kenar çubuğu kullanma.** `border-l-[3px] border-l-vurgu` ve türevleri
  bilinçli olarak kaldırıldı; her kutunun yanına renkli şerit koymak şablon görüntüsünün
  ana kaynağıydı. Yapıyı **tam çerçeve**, **zemin tonu** (`.kart-vurgulu` → `--bg-tint`) ve
  **tipografi** ile kur. Bölüm başlığının ayracı altındaki ince kuraldır (`.bolum-baslik`).
- **Nocturne yarıçap sözlüğü: 4 / 8 / 14 px** (`--radius-sm/md/lg`). Kart ve düğme 8 px.
- **Yapı çerçeveyle değil, yüzey + hairline halkayla kurulur.** `.kart` kenarlık taşımaz;
  `--shadow-sm` (`0 0 0 1px`) halkası ve `--surface` zemini yeter. Serbest kurallar iki uçta
  saydama söner (`.bolum-baslik`, `.panel-bolum`) — bu bir Nocturne imzasıdır, düz çizgiye
  çevirme.
- **Tekrar eden her yüzeyin tek bir sınıfı var; sayfa içine elle Tailwind yazma.**
  Aynı işi gören öğe iki sayfada iki farklı boyda çıkıyordu.
  - Düğme: `.dugme` + `.dugme-birincil` / `.dugme-ikincil` / `.dugme-cip` / `.dugme-ikon`.
    **Tek düğme boyu vardır** (`min-height: 2.75rem`) — ikinci bir "küçük düğme" boyu
    hem tutarsız görünüyor hem dokunma hedefini 44 px'in altına düşürüyor.
    Birincil düğme dolu aksandır; seçili çip `aria-pressed` ile taşınır, sınıf değiştirerek değil.
  - Form alanı: `.alan` (seçici, arama kutusu), onay kutusu `.onay`.
  - Küçük etiket ("Rüzgâr", "Nokta"): `.etiket-ust`.
  - Bölüm içi ara başlık ("Nokta Seçimi", "İpuçları"): `.alt-baslik`.
  - Kart görünümlü kısa bağlantı: `.kart .baglanti-cip`.
  - Satır içi açılır bölüm başlığı: `.acilir`.
  - Kart iç boşluğu `p-4`'tür; tablo hücresi `px-3 py-2.5`.
- **Dolgulu eylem yüzeyi `--vurgu-dolgu` okur, `--vurgu` değil.** `--vurgu` metin ve çizgi
  rengidir ve koyu temada açılmak zorundadır; dolgulu düğme ise iki temada da koyu pas
  zemin + beyaz yazıdır. Tek jetonla ikisi birden olmuyor — koyu temada düğme soluyor.
- **Hiçbir yerde büyük harfe çevirme yok** (`text-transform: uppercase`). Etiketler de
  başlık biçiminde yazılır — her kelimenin ilk harfi büyük, gerisi küçük. Ara başlıklar
  (`.alt-baslik`) gerçek başlıklardan **rengiyle** ayrışır: gövde mürekkebinden açık,
  kendi jetonunda (`--etiket`). O ton 19 px yarı kalın serifte WCAG'ın büyük metin
  eşiğini (3:1) karşılar; 13 px'lik `.etiket-ust` bu yüzden `--text-muted`'ta kalır (4,5:1).
- **Tek yazı yüzü: Inter.** Başlık ve gövde aynı; başlıklar 500 ağırlıkta. Serif başlık yok.
  **Inter depodan servis edilir** (`public/fonts/`, `src/styles/inter.css`), Google Fonts'tan
  değil: çalışma anında CDN'e gitmek çevrimdışı açılışta yazı tipini düşürür ve derlemeyi
  ağa bağımlı kılar. Sürüm yükseltmek için `npm run yazitipi:indir`. Türkçe için latin-ext
  altkümesi zorunlu (ğ ş İ ı). Ölçü değerleri (`18 cm`, `0,28 mm`,
  `40 gr`) `.olcu` sınıfıyla monospace; sayı içeren tablo ve kutular `.sayisal` ile
  `tabular-nums`.
- **Kart yapısı** için `.kart` sınıfını kullan, elle `rounded-* border border-line bg-surface`
  yazma. Vurgulu kart: `.kart-vurgulu`.
- **Çerçeveler 2 px, aralıklar geniş.** Kart, uyarı kutusu, tablo kabı, harita ve düğme
  çerçevesi 2 px'tir (`border-2`); yalnızca rozet gibi küçük çipler 1 px kalır. Kart
  ızgaralarında `gap-5`, döşeme/etiket ızgaralarında `gap-3`-`gap-4` kullanılır —
  `gap-2`'lik kart ızgarası öğeleri birbirine yapıştırıyor.
- **Bölge renkleri** (`--bolge-*`) tek kaynaktır: harita işaretçisi de nokta kartı da aynı
  jetonu okur. Yeni bir yerde bölge rengi gerekiyorsa `data-bolge` özniteliğini ver ve
  `.bolge-nokta` / `.bolge-metin` sınıflarını kullan. (Kartın sol kenarındaki renkli
  çubuk — `.bolge-kenar` — kaldırıldı; bölge kimliği kare ve etiket metniyle taşınıyor.)
- **Arka plan düzdür.** Kareli/desenli doku ekleme.

### Renk asla tek başına bilgi taşımaz

Zorluk, bulunabilirlik ve skor göstergelerinde **renk + dolu çubuk sayısı + sözel etiket**
üçlüsü birlikte bulunur, ayrıca `sr-only` açıklama eklenir. Yeni bir ölçek göstergesi
gerekirse sıfırdan yazma: `Zorluk.astro` veya `Bolluk.astro` bileşenini yeniden kullan.

### İkon + balon, metin yerine

"Gece aydınlatması var", "otopark zor" gibi kısa bilgiler metin yerine simgeyle gösterilir
(`Rozet.astro`). Kural:

- **Metinli düğmede ikon yok** — yazının yanına simge koyma, yazı yeterlidir.
  **Simge düğmesi** (yalnız ikon, metin yok) ayrı bir tiptir ve serbesttir: tema anahtarı,
  alt sekme çubuğu, hava panelindeki yenile ve konum düğmeleri. Kuralı şu:
  `.dugme-ikon` + **`aria-label` ve `title` birlikte** — `title` JavaScript kapalıyken
  açıklamanın tek kaynağı, `aria-label` ekran okuyucunun. İkisi de aynı metni taşır ve
  başlık biçimindedir ("Havayı Yenile").
  (Rozet teknik olarak `<button>`'dur ama orada ikon süs değil, içeriğin kendisidir:
  nokta kartlarında etiketsiz basılır.)

- **İki ikon seti var, ikisi de gömülü.** `IKONLAR` ev seti (24×24, çizgi);
  `IKONLAR_PH` Phosphor regular (256×256, dolgu) — Nocturne'ün seti, MIT lisanslı.
  `ikonSvg()` ve `Ikon.astro` ada bakıp doğru viewBox/dolgu-çizgi kipini seçer.
  Phosphor'u `unpkg.com`'dan **çekme**: ikon yazı tipi CDN'den gelince çevrimdışı açılışta
  bütün ikonlar kaybolur. Yeni bir Phosphor glifi gerekirse SVG'sini `IKONLAR_PH`'e göm.
- İkon yolları **yalnızca** `src/lib/ikonlar.ts` içinde tanımlanır; hem sunucu bileşeni
  (`Ikon.astro`) hem tarayıcıdaki panel aynı kaynağı kullanır. İkonu bileşen içine gömme.
- Her rozette **ekran okuyucular için gizli tam metin** ve **`title` özniteliği** bulunur;
  `title`, JavaScript kapalıyken açıklamanın tek kaynağıdır ve balon devreye girince
  JavaScript tarafından kaldırılır.
- Rozet gerçek bir `<button>` öğesidir, klavyeyle odaklanılabilir.

---

## Şema çizimleri (SVG)

Tüm şemalar elle çizilmiş satır içi SVG'dir; dış görsel dosyası yoktur.

- **Anlamsal renk zorunludur.** Her parça türü kendi rengini taşır ve **etiketi de aynı rengi
  alır**: `misina` (koyu mavi-gri), `orgu` (mor), `lider` (camgöbeği), `metal` (çelik),
  `igne` (koyu gri), `yem` (turuncu), `dugum` (turuncu), `hareket` (turuncu kesik çizgi),
  `uc` (düğümlerde serbest uç — turuncu). Etiket sınıfları: `lbl-misina`, `lbl-lider`,
  `lbl-metal`, `lbl-yem`, `lbl-igne`, `lbl-orgu`.
  Tek düze tek renk çizim yapma — okunabilirliğin çoğu bu ayrımdan geliyor.
- Düğüm şemalarında **ana hat ile serbest uç farklı renkte** olmalı; düğümü anlaşılır kılan
  temel şey budur.
- Balık siluetleri bu paletin dışındadır: `currentColor` kullanır, üst öğenin rengini alır.
- Uzun açıklama cümlelerini çizimin içine yazma — sayfada zaten "Adım adım" veya
  "Bileşenler" bölümünde var. Çizimde yalnızca kısa parça etiketleri bulunur.
- **Etiketler viewBox dışına taşmamalı ve birbiriyle çakışmamalı.** Şema değiştirdikten sonra
  bunu tarayıcıda ölçerek doğrula (`getBoundingClientRect`, `getBBox` grup dönüşümünü
  hesaba katmaz ve yanlış sonuç verir).
- Şemadaki her etiketin karşılığı `src/lib/semaEtiketleri.ts` içinde tanımlanır; sayfada
  "Şemada ne görüyorsun?" lejantı olarak basılır. Yeni etiket eklersen lejanta da ekle.

---

## Mobil kabuk ve gezinme

Site **mobil-öncelikli** tasarlanır: telefon birincil hedef, geniş ekran ikincil.

- **Gezinme tek kaynaktan**: `src/lib/gezinme.ts`. Alt sekme çubuğu, geniş ekrandaki üst
  menü ve `/menu` sayfası aynı listeyi okur. Yeni sayfa eklerken yalnızca burası güncellenir.
  Menü ipuçlarına sayı yazma ("22 tür" gibi); veri büyüyünce sessizce yanlışa döner.
- **Telefonda birincil gezinme alt sekme çubuğudur** — başparmak menzilinde, dört sekme:
  Bugün, Noktalar, Takvim, Menü. Hamburger menü kullanma. Açık sayfa hiçbir plan sekmesine
  ait değilse "Menü" vurgulanır (`aktifSekme()`), yani çubuk her sayfada nerede olunduğunu söyler.
- **Gövdenin alt boşluğu sekme çubuğunun yüksekliğini + kenarlığını + `safe-area-inset-bottom`
  değerini kapsar**, yoksa footer'ın son satırı çubuğun altında kalır.
- **Dokunmatikte üstüne gelme jesti yoktur.** Açıklamalar (`.terim`, `Rozet.astro`) telefonda
  ekranın altından çıkan panel olarak gösterilir; masaüstünde imlecin yanındaki balon olarak.
  Kipi `terim.ts` seçer ve `#terim-balonu[data-mod]` ile CSS'e bildirir — medya sorgusuyla
  ayrıca karar verme, iki karar birbirinden ayrışır.
- Dar ekranda sabit genişlikli yan sütun kullanma (`w-40 shrink-0` gibi): 360 px'de metin
  sütununu ezer. Dar ekranda dikey yığ, `sm:` ile yan yana geç.
- **İkincil denetimler telefonda katlanır.** Nokta filtreleri `<details data-filtreler>`
  içindedir: sunucu paneli **açık** basar (JavaScript kapalıyken filtreler görünür kalsın),
  hemen ardındaki satır içi betik dar ekranda kapatır — bu yüzden panel bir kez açılıp
  kapanmıyor. Geniş ekranda başlık gizlenir ve panel hep açıktır; bu yüzden dar→geniş
  yeniden boyutlamada betiğin paneli geri açması **zorunlu**, yoksa filtreler erişilemez
  hale gelir. Katlıyken kaç filtrenin açık olduğu başlıktaki rozetten okunur.

### Konum

- **Konum yalnızca kullanıcı açıkça isteyince sorulur.** Sayfa açılışında izin istemi
  çıkarma; tetikleyici her zaman görünür bir düğme olsun.
- `konumDestekli()` (`src/lib/konum.ts`) güvenli bağlamı da denetler: `http` üzerinde
  `navigator.geolocation` var görünür ama istek sessizce başarısız olur. Desteklenmiyorsa
  düğmeyi hiç gösterme.
- **İzin verilmezse hiçbir şey bozulmaz:** liste alfabetik kalır, harita kapsam alanına
  çerçevelenir, hata `role="status"` taşıyan bir satırda açıklanır.
- Kullanıcı kapsam alanının dışındaysa "en yakın nokta" yine de yüzlerce km uzakta olabilir;
  bu durumu uyarı olarak yaz, sessizce uzak bir nokta seçme.

---

## Sayfa geçişleri (ClientRouter)

`ClientRouter` etkindir ve bağlantılar görüş alanına girince önceden çekilir. Bunun iki tuzağı
var, ikisi de sessizce bozar:

- **ES modülü sayfa geçişinde yeniden çalışmaz.** Adacıkları doğrudan çağırma; kurulumu
  `document.addEventListener('astro:page-load', () => baslat())` ile bağla. Aksi hâlde ikinci
  ziyarette harita, filtre ve hava paneli ölü gelir.
- **`is:inline` betikler yeniden çalışmaz**; çalışması gerekenlere `data-astro-rerun` ekle.
- `document`/`window` üzerindeki dinleyiciler geçişten sağ çıkar, DOM referansları çıkmaz.
  Bir adacık her ikisini de kullanıyorsa dinleyicileri bir kez bağla, DOM referanslarını her
  `baslat()` çağrısında yenile (`terim.ts` bu deseni izler).
- **`<html>` öznitelikleri geçişte yenisiyle değişir**, yani tema `data-theme` silinir.
  `astro:after-swap` sonrası yeniden uygulanır.

---

## Çevrimdışı çalışma (PWA)

Site kurulabilir bir uygulamadır: `public/manifest.webmanifest` + `public/sw.js`.
Derleme sonrası `scripts/sw-surum.mjs` çalışır; çıktının içerik özetini service
worker'a sürüm damgası olarak yazar ve önbelleğe alınacak dosya listesini
`dist/sw-liste.json` içine döker. Çıktı değişmezse damga da değişmez.

- **Tüm site kurulumda önbelleğe alınır** (sıkıştırılmış ~2 MB). Kıyıda şebeke
  yokken rehberin tamamı açılır. Derleme, paket 25 MB'ı aşarsa uyarır.
- **Önbelleğe alınmayanlar bilinçlidir:** Open-Meteo istekleri ve harita karoları
  ağdan geçer. Hava verisinin tazeliği `openMeteo.ts` içindeki zaman damgalı
  localStorage katmanında yönetilir; service worker'a ikinci bir önbellek koyarsak
  veri yaşı iki yerden yönetilir.
- **Önbellek anahtarında sondaki eğik çizgi normalleştirilir.** Bağlantılar
  `/noktalar` derken statik çıktı `/noktalar/index.html`; ikisi aynı kayda düşmezse
  çevrimdışında sayfa bulunamaz.
- **Önbelleğe alınan adres kanonik olmalı — yönlendirmeyle gelen yanıt saklanamaz.**
  `sw-liste.json` sayfaları `/noktalar/` biçiminde (eğik çizgili) yazar, çünkü bazı statik
  sunucular (GitHub Pages) `/noktalar` isteğini 301 ile eğik çizgiliye yönlendirir.
  Yönlendirmeyi izleyen yanıtın `redirected` bayrağı açık olur ve tarayıcı böyle bir kaydı
  **gezinme isteğine yanıt olarak vermeyi reddeder**: sayfa ağ hatasıyla düşer, üstelik
  yalnızca service worker kurulduktan sonra. `fetch` dinleyicisi de aynı sebeple
  `redirected` yanıtı önbelleğe koymaz.
- **Derleme yeniden üretilebilir olmalı.** Sürüm damgası çıktının içerik özeti olduğu için
  aynı kaynaktan farklı çıktı üretmek, kurulu her kullanıcıya 13 MB'ı yeniden indirtir.
  `getCollection('species')` glob ile okunur ve sırası dosya sistemine göre değişir;
  her çağrı kimliğe göre sıralanır. Sayfaya gömülen her listede aynı dikkat gerekir.
- **`navigator.onLine` kullanma.** Yalnızca ağ arayüzü var mı der; internetsiz bir
  Wi-Fi'da da `true` döner. Bağlantı durumu hakkında bir şey yazacaksan onu
  isteğin gerçekten düşmüş olmasına dayandır.
- Simgeler `npm run ikon:uret` ile üretilir ve depoda durur; kaynağı başlıktaki
  logonun ta kendisidir (`ikonlar.ts` içindeki `balik`). Logo değişirse yeniden üret.

---

## Terim balonları

Metinlerdeki balıkçılık terimleri **derleme zamanında** işaretlenir (`src/lib/terimler.ts`).

- Yeni ekipman veya sözlük maddesi eklediğinde metinlerde otomatik yakalanır; elle
  `<button class="terim">` yazma.
- Prose metin basarken `Metin.astro` veya `Liste.astro` kullan ve sayfa genelinde paylaşılan
  bir `gorulen` kümesi geçir — böylece her terim sayfada yalnızca ilk geçtiği yerde işaretlenir.
- Kendi sayfasında terimin kendine bağlanmaması için `haric` parametresini ver.
- Dört harften kısa terimler taranmaz (gürültü yapıyor); kısa bir terim eklerken daha uzun
  bir eş ad da ver.

---

## Veri

- Şemalar `src/content.config.ts` içinde zod ile tanımlıdır. Eksik veya hatalı alan derlemeyi
  patlatır — şemayı gevşetmek yerine veriyi düzelt.
- **Çift yönlü ilişkiler tutarlı olmalı:** bir tür bir noktayı listeliyorsa o nokta da o türü,
  bir nokta bir türü listeliyorsa o tür de o noktayı listelemeli. `npm run validate` her iki
  yönü de denetler. Nokta eklerken tür listelerini elle yazma; `spots.json`'ı kaynak kabul edip
  türlerin `noktalar` alanını ondan üret.
- **Yasal veri hafızadan yazılmaz.** Boy limitleri ve yasaklar kaynağıyla birlikte tutulur:
  her kaydın `kaynak` ve `kontrolTarihi` alanı doldurulur ve sayfada gösterilir. Kaynaklar
  çelişiyorsa **daha büyük/kısıtlayıcı değeri** al ve notunu yaz.
- **İç sularda av yasağı dönemi ayrı bir alandır** (`yasal.yasakDonemi`). Göl ve derede
  yaşayan her türde doldurulur; `validate-data.mjs` eksikse derlemeyi durdurur. Noktaya özgü
  mevzuat (üreme yasağı, içme suyu havzası) `spots.json` içindeki `mevzuat` alanına kaynağıyla
  yazılır. İçme suyu barajlarında (Ömerli, Elmalı, Darlık, Alibeyköy, Büyükçekmece, Sazlıdere)
  nokta önerilmez.
- Ağ isteği gerektiren veri (olta dükkânları) **derleme sırasında değil**, elle çalıştırılan
  bir betikle çekilir ve dosyaya yazılır. Derleme ağa bağımlı olmamalı.

---

## Bozulmaya dayanıklılık

Bunlar isteğe bağlı iyileştirme değil, kabul koşuludur:

- **Karar kartı** (`kararKarti()`, tasarım 1b) panelin en üstündedir ve tek bir "bunu yap"
  der. İçindeki hiçbir cümle sabit değildir: saat penceresi günün gerçek batımından,
  gerekçeler skor motorunun `faktorler[].gerekce` alanından, ekipman satırları ve **yasal
  boy** tür verisinden gelir. Tasarım dosyasındaki boy limitlerini kopyalama — onlar
  kaynaksız ve iki türde depodaki kaynaklı değerle çelişiyordu.
- **Hava paneli bloklara ayrılır** ve ayracı `.panel-bolum` kuralıdır: karar kartı,
  *Nokta Seçimi* (sabit noktalı sayfalarda hiç basılmaz), *Bugünün Koşulları*, *Bugün Ne Çıkar*. Bölüm başlıkları
  her durumda görünür; canlı/statik geçişini içerideki `[data-canli]` ve `[data-statik]`
  kapları yapar. `[data-canli]` **birden fazladır**, adacık hepsini birlikte açıp kapatır.
- **Son yenileme damgası yenile düğmesinin yanındadır** (`[data-guncelleme]`): "ne kadar
  taze" sorusu "tazele" eylemiyle aynı yerde cevaplanır. Damga kısadır (`01:14 itibarıyla`,
  bayatsa uyarı renginde `3 saat önce alındı`); uzun açıklamalar (tatlı su uyarısı, servise
  ulaşılamama) `[data-durum-metni]` satırında kalır ve söyleyecek bir şey yoksa o satır gizlenir.
- **Canlı veri gelmezse** sayfa boş kalmaz; mevsime dayalı statik içerik görünür ve durum
  açıkça yazılır.
- **Bayat veri gizlenmez, etiketlenir.** Ağ düşerse son alınan hava paketiyle devam edilir
  (24 saate kadar; ötesi "şu an"ı kapsamadığı için mevsimsel listeye düşer) ve panelde
  "3 saat önce alınan veri" gibi bir damga uyarı renginde yazılır.
- **JavaScript kapalıysa** tüm içerik okunur. "Bu ay" gibi zamana bağlı bilgiler sunucuda
  derleme ayına göre basılır, tarayıcı doğru aya düzeltir.
- **Harita karoları gelmezse** harita gizlenir, liste ve filtreler çalışmaya devam eder.
- **Deniz modeli bir noktayı kapsamıyorsa** (kapalı ve sığ sular) veri eksikliği gizlenmez:
  nokta `denizVerisiZayif: true` ile işaretlenir, arayüz nedenini söyler ve skor kalan
  faktörlerle hesaplanır.
- **Leaflet'te `fitBounds` yalnızca kap ölçülebilir haldeyken çalışır.** Gizli bir kap 0×0'dır
  ve anlamsız bir yakınlaştırma üretir; önce `hidden` kaldırılır, `invalidateSize()` çağrılır,
  sonra çerçeve kurulur.
- **DOM'dan çıkarılan bir `<option>` kendi `selected` durumunu korur** ve geri eklendiğinde
  sessizce yeniden seçili hale gelir. Seçenek listesini daraltıp genişleten her yerde seçili
  değeri ayrı bir değişkende tut ve her yeniden kurulumdan sonra açıkça geri yaz.
- Saat ve ay hesapları daima `Europe/Istanbul` üzerinden yapılır (`src/lib/time.ts`);
  `getHours()` / `getMonth()` doğrudan kullanılmaz.

---

## Doğrulama

Değişiklikten sonra:

```bash
npm run validate   # veri bütünlüğü ve çapraz referanslar
npm run test       # skor motoru, rüzgâr, ay evresi, zaman, metin biçimi
npm run check      # Astro + TypeScript
npm run build      # statik çıktı
```

Ayrıca gözden kaçmaması gerekenler:

- Toplu metin değiştirme yaparken **her değişikliğin gerçekten eşleştiğini doğrula.**
  Sessizce eşleşmeyen bir düzenleme yarım kalmış işaretleme bırakabiliyor.
- İki temada ve 360 px genişlikte yatay taşma olmamalı.
- Üretilen HTML'de sahipsiz/kapanmamış etiket olmamalı.
- İç bağlantıların tamamı geçerli olmalı.
