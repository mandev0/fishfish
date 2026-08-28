# Balıkçılık Rehberi — İstanbul, Kocaeli ve Sapanca

Kıyıdan ve tatlı sudan balık tutmak için tek başvuru kaynağı: hangi ay hangi balık,
hangi yöntemle avlanılır, o yöntem için hangi takım kurulur, nereye gidilir — ve bugünün
havası buna uygun mu.

Kapsanan alan iki bölümdür:

- **Deniz:** İstanbul Boğazı, Marmara, Karadeniz kıyısı, Adalar ve Kocaeli
  (İzmit Körfezi ile Kandıra kıyısı).
- **Tatlı su:** Sapanca Gölü (Sakarya ve Kocaeli kıyıları), Sakarya iç suları
  (Sakarya Nehri, Poyrazlar ve Taşkısığı gölleri) ve İstanbul dereleri
  (Riva, Ağva Göksu ve Yeşilçay) ile Küçükçekmece Gölü.

Nokta seçimi su → il → bölge → nokta sırasıyla daralır; hem harita sayfasındaki filtrede
hem de günlük tavsiye panelinde.

**Yöntem, takım ve tür ayrı katmanlardır.** Yöntem "nasıl avlandığın" (LRF, spin, aç-çek,
yemli dip, şamandıra, çapari, egi, surf, feeder), takım "neyi bağladığın", tür "neyi
avladığın". Tekneden yapılan yöntemler (sürütme, tekne jigi) kapsam dışıdır.

Tamamen **statik** bir Astro sitesi. Backend, veritabanı ve API anahtarı yok.
Canlı hava/deniz verisi doğrudan tarayıcıdan çekilir; veri gelmezse site mevsime dayalı
statik içerikle çalışmaya devam eder.

**Mobil öncelikli ve kurulabilir.** Telefonda alt sekme çubuğuyla gezilir, ana ekrana
eklenince tam ekran açılır. Kurulumda tüm rehber cihaza indirilir (sıkıştırılmış ~2 MB),
böylece kıyıda şebeke yokken balıklar, takımlar, düğümler ve noktalar açılmaya devam eder.
Canlı hava verisi bağlantı ister; bağlantı yoksa son alınan veri, kaç saat önce alındığı
yazılarak gösterilir.

**Konum isteğe bağlıdır.** İzin verirsen nokta listesi sana yakınlığa göre sıralanır ve
günlük tavsiye paneli en yakın noktayı seçer. İzin vermezsen her şey aynen çalışır.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # dist/ klasörüne statik çıktı
npm run preview    # build çıktısını yerelde sunar
```

## Doğrulama

```bash
npm run validate   # veri bütünlüğü: id referansları, koordinatlar, yasal kayıtlar
npm run test       # skor motoru, rüzgâr gülü, ay evresi ve zaman birim testleri
npm run check      # Astro + TypeScript tip denetimi
```

Olta malzemecisi listesini tazelemek için (ağ gerektirir, build'in parçası değildir):

```bash
npm run veri:dukkanlar
```

Uygulama simgelerini yeniden üretmek için (başlıktaki logo değiştiyse; tarayıcı gerektirir):

```bash
npm i -D playwright-core && npx playwright install chromium
npm run ikon:uret
```

## Telefondan test

`npm run dev` telefon testi için yeterli değil: service worker kaydı yalnızca üretim
derlemesinde yapılır. `dev.sh` gereken zinciri kurar — eski süreçleri kapatır, derler,
`astro preview` başlatır ve WSL2 kullanıyorsan LAN'dan erişim için Windows tarafında bir
TCP yönlendirici çalıştırır:

```bash
./dev.sh            # derle, sunucuyu başlat, adresleri yaz
./dev.sh --hizli    # derlemeyi atla (dist güncelse)
./dev.sh durum      # ne çalışıyor, zincir sağlam mı
./dev.sh dur        # sunucuyu ve yönlendiriciyi kapat
```

İki adres çıkar:

- **USB** — `http://localhost:4321`. Chrome'da `chrome://inspect` → Port forwarding
  (`4321` → `localhost:4321`). Telefon adresi `localhost` gördüğü için güvenli bağlam
  sayılır; service worker, konum ve kurulum ek ayar olmadan çalışır.
- **LAN** — `http://<windows-lan-ip>:4322`. Kablo gerekmez ama `http` olduğu için güvenli
  bağlam değildir. Telefonda Chrome → `chrome://flags` → "Insecure origins treated as
  secure" alanına bu adresi yazıp Enabled yapman gerekir.

Güvenli bağlamın aktif olduğunu anlamanın en hızlı yolu: `/noktalar` sayfasında
"Konumuma göre sırala" düğmesi görünüyorsa aktiftir. O düğmeyi `konumDestekli()` basıyor
ve fonksiyon `isSecureContext` denetliyor.

## Yayına alma

Sunucuda Docker yeterli; Node kurmak gerekmez, site imajın içinde derlenir.

```bash
git pull
docker compose up -d --build
```

`docker-compose.yaml` kapsayıcıyı `127.0.0.1:5453` üzerinde yayınlar — yani yalnızca
makinenin kendisinden erişilebilir. TLS ve alan adı bu dosyanın dışındadır: önündeki
ters vekil `fish.selimakpinar.com` isteklerini `http://127.0.0.1:5453` adresine taşır.
Ters vekilin kendisi bir kapsayıcıysa yayın satırını `"5453:80"` yapıp servisi vekilin
ağına ekle.

`docker/nginx.conf` iki işi yapar:

- **Adresleri olduğu gibi servis eder.** Site içindeki bağlantılar `/noktalar` der,
  statik çıktı ise `/noktalar/index.html`. `try_files` sıralaması bu yüzden
  `$uri/index.html`'i `$uri/`den önce dener: aksi hâlde nginx sona eğik çizgi ekleyen
  bir 301 döndürür ve adres, service worker'ın önbellek anahtarından ayrışır.
- **Önbellek başlıklarını ayırır.** `sw.js` ve `manifest.webmanifest` hiç önbelleğe
  alınmaz (yeni sürümün fark edilmesi buna bağlı), adında içerik özeti taşıyan
  `/_astro/` varlıkları bir yıl `immutable`, HTML ise her zaman doğrulanır.

Kapsayıcı salt okunur bir dosya sisteminde çalışır ve `/healthz` üzerinden sağlık
yoklaması yapar; `docker compose ps` durumu `healthy` göstermelidir.

## Çevrimdışı çalışma

`npm run build`, Astro çıktısını ürettikten sonra `scripts/sw-surum.mjs` ile service
worker'ın sürüm damgasını ve önbellek listesini yazar:

```
Service worker sürümü 7a3f2fb32623 · 172 dosya · 9.3 MB çevrimdışı içerik
```

Sürüm, çıktının içerik özetidir — çıktı değişmezse tarayıcı gereksiz yere güncellemez.
Önbelleğe **alınmayanlar** bilinçlidir: Open-Meteo istekleri ve harita karoları ağdan
geçer, çünkü hava verisinin tazeliği ayrı bir zaman damgalı katmanda yönetiliyor.

## İçerik

| Ne | Kaç | Nerede |
|---|---|---|
| Balık türü | 31 (22 deniz + 9 tatlı su) | `src/data/species/*.json` |
| Nokta | 71 (59 kıyı + 12 tatlı su) | `src/data/spots.json` |
| Yöntem | 9 | `src/data/methods.json` |
| Takım | 16 | `src/data/rigs.json` |
| Düğüm | 7 | `src/data/knots.json` |
| Sözlük terimi | 40 | `src/data/glossary.json` |
| Ekipman parçası | 41 | `src/data/gear.json` |
| Olta malzemecisi | 28 | `src/data/shops.json` (OpenStreetMap'ten çekilir) |

Veri şemaları `src/content.config.ts` içinde zod ile tanımlı. Eksik veya hatalı bir alan
build'i patlatır, yani bozuk veri sessizce sızamaz.

### Yeni yöntem eklemek

1. `src/data/methods.json` içine kaydı yaz; `ikon` alanı `src/lib/ikonlar.ts` içinde tanımlı
   bir anahtar olmalı. Tekneden yapılan yöntemler kapsam dışıdır.
2. İlgili takımların `yontem` alanını yeni kimliğe çevir veya yeni takım ekle.
3. Yöntemin uygulanabildiği noktalarda `spots.json` → `yontemler` dizisine kimliği ekle.
   Yöntemin `sular` alanı ile noktanın su türü uyuşmalı; `npm run validate` bunu denetler.
4. `npm run validate && npm run test && npm run build`.

### Yeni tür eklemek

1. `src/data/species/<id>.json` dosyasını mevcut bir türü örnek alarak oluştur.
2. `src/data/spots.json` içinde ilgili noktaların `turler` dizisine `<id>` ekle.
   (Türün `noktalar` alanı bu ilişkinin diğer yönüdür; ikisi tutarlı olmalı,
   `npm run validate` bunu denetler.)
3. İstersen `src/components/svg/FishSilhouette.astro` içine siluet arketipi ve
   ayırt edici işaretleri ekle. Eklemezsen varsayılan torpido gövde kullanılır.
4. `npm run validate && npm run build`.

## Tasarım sistemi

Yön: **deniz haritası / balıkçı almanağı** — jenerik arayüz görünümünden kaçınmak için
bilinçli seçimler:

- **İki renkli sistem.** `--accent` Boğaz laciverti (yapı ve bağlantılar),
  `--vurgu` şamandıra turuncusu (aksan: aktif menü, bölüm başlığı çubuğu, odak halkası,
  panel kenarı). Turuncu az ve yerinde kullanılır.
- **Bölge renkleri.** On iki bölgenin (Boğaz-Rumeli, Boğaz-Anadolu, Karadeniz,
  Marmara-Avrupa, Marmara-Anadolu, Adalar, İzmit Körfezi, Kandıra, İstanbul iç suları,
  Kocaeli iç suları, Sapanca Gölü ve Sakarya iç suları) kendi rengi var. Aynı renk hem harita işaretçisinde
  hem nokta kartının sol kenarında kullanılır; harita rengi CSS jetonundan okunur,
  yani tek kaynak vardır.
- **Keskin köşeler.** Tailwind'in `--radius-*` jetonları 1-9 px aralığına indirildi.
  Yapı yuvarlaklıkla değil, çizgi ve sol kenar vurgusuyla kuruluyor.
- **Serif başlıklar** (`--font-baslik`, Iowan/Palatino/Georgia zinciri), sans gövde metni.
  Ölçüler (`.olcu`) monospace, sayı içeren her yer `tabular-nums`.
- **İkon + balon.** "Gece aydınlatması var" gibi bilgiler metin yerine simgeyle gösterilir
  (`Ikon.astro`, `Rozet.astro`). Simge tek başına anlam taşımaz: her rozette ekran
  okuyucular için gizli metin, `title` yedeği ve üzerine gelince/dokununca tam açıklama vardır.
  İkon yolları `src/lib/ikonlar.ts` içinde — aynı set hem sunucuda hem hava panelinde kullanılır.
- **Başlıklar ve etiketler başlık biçiminde** ("Yem ve Sahte Yem", "Çok Kolay", "Park Zor");
  cümleler normal cümle biçiminde. Dönüşüm `src/lib/metin.ts` → `baslikBicimi()` ile yapılır:
  Türkçe i/İ, ı/I ayrımını korur ve TDK yazımına uyarak bağlaçlar ile soru ekini
  ("ve, ile, da, de, mı/mi") küçük bırakır. `tests/baslik.test.ts` kaynaktaki sabit
  başlıkların bu biçimde olduğunu denetler.
- **Şemalarda anlamsal renk.** Her parça türü kendi rengini taşır ve etiketi de aynı rengi
  alır: ana misina koyu mavi-gri, örgü mor, fluorocarbon lider camgöbeği, metal çelik grisi,
  yem turuncu, hareket okları turuncu kesik çizgi. Düğüm şemalarında ana hat ile serbest uç
  farklı renktedir — düğümü anlaşılır kılan asıl şey budur.
- **Renk tek başına bilgi taşımaz.** Zorluk, bulunabilirlik ve skor rozetlerinde renk +
  dolu çubuk sayısı + sözel etiket üçlüsü birlikte bulunur.

## Terim balonları

Metinlerdeki balıkçılık terimleri **derleme zamanında** işaretlenir
(`src/lib/terimler.ts`): sözlük maddeleri ve 41 ekipman kaydı tek bir dizinde
toplanır, metinde geçtiklerinde noktalı altı çizili bir düğmeye sarılır.
Tarayıcıya hazır HTML gider; istemci tarafı yalnızca balonu açıp kapatır.

- Masaüstünde üzerine gelince, dokunmatikte dokununca açılır.
- Klavye ile odaklanınca da açılır (`:focus-visible`), Escape kapatır.
- Ekipman terimlerinde balon ayrıntılı sayfaya bağlanır.
- Aynı terim bir sayfada yalnızca **ilk geçtiği yerde** işaretlenir; bunun için
  sayfa bileşenleri paylaşılan bir `gorulen` kümesi geçirir.

Türkçe ekler de yakalanır: terimden sonra en fazla dört küçük harfe izin verilir,
böylece "misinayı", "zokayla", "çapariden" aynı kayda bağlanır. Dört harften kısa
terimler gürültü yaratmamak için taranmaz.

Takım şemalarındaki SVG etiketlerine balon eklenemediği için her şemanın altına
"Şemada ne görüyorsun?" lejantı basılır (`src/lib/semaEtiketleri.ts`) — etiket
adı, tek cümlelik açıklama ve ilgili sayfaya bağlantı.

## Skor motoru

`src/lib/score.ts` bir tür profilini o anki hava/deniz koşullarıyla birleştirip
0-100 arası bir skor ve **her faktörün Türkçe gerekçesini** üretir.
Faktörler: mevsim, su sıcaklığı, rüzgâr şiddeti, rüzgâr yönü (türün tercihine göre),
dalga, 6 saatlik basınç eğilimi, saat dilimi, ay evresi ve gökyüzü.

Bütün ağırlıklar ve eşikler `src/lib/score.config.ts` içinde tek yerde toplanmıştır;
tavsiyeleri kalibre etmek için sadece o dosyaya dokunman yeter.

**Bu bir tahmin aracıdır, bilimsel bir model değildir.** Skorlar balıkçılık pratiğinden
türetilmiş sezgisel kurallara dayanır. Bu yüzden arayüz skoru kara kutu olarak sunmaz:
her satırda hangi faktörün ne kadar etkilediği açılıp görülebilir.

## Veri kaynakları

- **Hava:** [Open-Meteo Forecast API](https://open-meteo.com) — rüzgâr, basınç, bulut, yağış, gün doğumu/batımı
- **Deniz:** [Open-Meteo Marine API](https://open-meteo.com) — dalga yüksekliği, deniz suyu sıcaklığı
- **Harita:** [OpenStreetMap](https://www.openstreetmap.org/copyright) karoları, Leaflet ile
- **Ay evresi:** yerel hesap, API kullanılmaz (`src/lib/moon.ts`)
- **Olta malzemecileri:** [OpenStreetMap Overpass API](https://overpass-api.de) — `shop=fishing`
  etiketli noktalar, ODbL lisansı. Elle çekilip `src/data/shops.json`'a yazılır;
  derleme ağa bağımlı değildir.

Hiçbiri API anahtarı istemez ve hepsi tarayıcıdan CORS ile çağrılabilir.

### Deniz verisinin kapsamadığı yerler

Open-Meteo'nun deniz modeli tatlı suları (göl, baraj, dere) hiç kapsamaz ve İzmit
Körfezi'nin doğu yarısını (Ulaşlı, Değirmendere, Gölcük, İzmit) da kapsamıyor — dalga ve deniz suyu sıcaklığı boş geliyor. Bu noktalar veride
`denizVerisiZayif: true` ile işaretli; arayüz durumu gizlemek yerine nedenini söylüyor ve
skorları kalan faktörlerle hesaplıyor.

Karadeniz kıyısında model hücresi 11-20 km açığa denk gelir (Riva 20 km, Kerpe 14 km).
Bu bir hata değil, model çözünürlüğünün sonucudur; dalga ve sıcaklık açık deniz değeridir.

### Neden "balığın şu an nerede tutulduğu" yok?

Türkiye'de canlı av raporu paylaşan açık bir servis bulunmuyor. GBIF ve iNaturalist gibi
bilimsel gözlem kaynakları denendi; İstanbul için kayıt sayısı çok az ve gürültülü
(iNaturalist'te akvaryum balığı fotoğrafları bile karışıyor). Bu yüzden nokta bilgisi
**elle kürate edilmiş bir nokta veritabanı** olarak tutuluyor ve canlı veri
yalnızca "bugün bu nokta uygun mu?" sorusunu yanıtlamak için kullanılıyor.

## Yasal veri uyarısı

`yasal` alanlarındaki asgari boy limitleri, 6/2 Numaralı Amatör Amaçlı Su Ürünleri
Avcılığının Düzenlenmesi Hakkında Tebliğ'e (No: 2024/21, Resmî Gazete 11.08.2024/32629,
1 Eylül 2024 – 31 Ağustos 2028) dayanır. Her kaydın `kaynak` ve `kontrolTarihi` alanı vardır
ve site üzerinde görünür.

İç su türlerinde ayrıca `yasal.yasakDonemi` alanı doldurulur: iç sularda 15 Mart – 15 Haziran
arası üreme dönemi av yasağı uygulanır ve bu yasak amatör oltacıyı da kapsar. Akarsularda
oltayla tatlısu kefali ve gümüş balığı avı bu dönemde de serbesttir. Tarihler her yıl il tarım
ve orman müdürlüğünün duyurusuyla teyit edilir; tatlı su noktalarının `mevzuat` alanı bunu
kaynağıyla birlikte taşır.

İstanbul'un içme suyu barajlarında (Alibeyköy, Büyükçekmece, Darlık, Elmalı II, Ömerli,
Sazlıdere) ticari avlanma yasaktır ve havzaların girişi kısıtlıdır; bu rehber oralarda
nokta önermiyor.

Bu değerler değişebilir ve bazı türlerde kaynaklar arasında farklar mevcuttur.
**Tebliğ yenilendiğinde `kontrolTarihi` alanlarını güncellemeyi unutma.**

## Mimari notları

- `src/lib/` — saf TypeScript, DOM'a bağımlı değil, doğrudan test edilebilir.
- `src/components/islands/` — tarayıcıda çalışan iki ada: hava paneli ve nokta haritası.
  Her ikisi de bozulduğunda sayfayı boş bırakmaz; sunucuda basılmış statik içerik ayakta kalır.
- `src/components/svg/` — bütün şemalar elle çizilmiş inline SVG. `currentColor` kullandıkları
  için karanlık/aydınlık temaya kendiliğinden uyum sağlarlar, telif sorunu yoktur.
- **Gezinme:** 1024 px altında menü bir panele dönüşür (bölümlenmiş, 44 px hedefler,
  `aria-expanded`, Escape/dışarı tıklama ile kapanır, açıkken arka plan kaymaz).
  Üstte kaydırmalı şerit yok.
- **Harita:** gömülü haritaların standart davranışı — düz tekerlek sayfayı kaydırır,
  Ctrl/⌘ + tekerlek yakınlaştırır; dokunmatikte tek parmak sayfayı kaydırır, iki parmak
  haritayı gezdirir. Yanlış jest denendiğinde ne yapılacağını söyleyen bir katman belirir.
  Karo sunucusuna erişilemezse harita gizlenir, liste ve filtreler çalışmayı sürdürür.
- **Zorluk ve bolluk göstergeleri** pastel bir skalada renklendirilir (zorlukta yeşil→kırmızı,
  bollukta nötr→yeşil). Renk tek başına anlam taşımasın diye her rozette dolu çubuk sayısı
  ve sözel etiket de bulunur.
- Saat ve ay hesapları her zaman `Europe/Istanbul` üzerinden yapılır (`src/lib/time.ts`),
  böylece tarayıcının saat dilimi ne olursa olsun sonuç aynıdır. "Bu ay" bilgisi de
  derleme zamanına çivilenmez; tarayıcıda hesaplanır, yani site bir kez derlenip
  aylarca kullanılabilir.
