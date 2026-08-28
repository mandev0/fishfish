#!/usr/bin/env bash
#
# dev.sh — telefondan test etmek için yerel sunucuyu kurar.
#
# Neden ayrı bir betik: telefon testi `npm run dev` ile yapılamıyor. Service
# worker kaydı `import.meta.env.PROD`'a bağlı, yani önce derleyip `astro preview`
# ile sunmak gerekiyor. Üstüne WSL2 NAT kipinde çalıştığı için LAN'dan gelen
# bağlantılar WSL'e ulaşmıyor; araya Windows tarafında bir TCP yönlendirici
# koyuyoruz:
#
#   telefon -> <windows-lan-ip>:4322 -> yönlendirici -> 127.0.0.1:4321 -> WSL preview
#
# 4321 yerine 4322 dinlemesinin nedeni: Windows'ta 4321'i biri dinlerse WSL'in
# localhost yönlendirmesi devreden çıkar ve yönlendirici kendi kendine bağlanır.
#
# Kullanım:
#   ./dev.sh              derle, sunucuyu başlat, adresleri yaz
#   ./dev.sh --hizli      derlemeyi atla (dist güncelse)
#   ./dev.sh dur          sunucuyu ve yönlendiriciyi kapat
#   ./dev.sh durum        ne çalışıyor, zincir sağlam mı

set -uo pipefail

PROJE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 1
readonly PROJE
readonly WSL_PORT=4321
readonly LAN_PORT=4322
readonly GUNLUK_DIZINI="$PROJE/.dev"
readonly SUNUCU_GUNLUGU="$GUNLUK_DIZINI/preview.log"
readonly YONLENDIRICI_JS="fishfish-yonlendirici.js"

if [[ -t 1 ]]; then
  readonly KIRMIZI=$'\033[31m' YESIL=$'\033[32m' SARI=$'\033[33m' SOLUK=$'\033[2m' KALIN=$'\033[1m' SIFIR=$'\033[0m'
else
  readonly KIRMIZI='' YESIL='' SARI='' SOLUK='' KALIN='' SIFIR=''
fi

bilgi()  { printf '%s\n' "$*"; }
tamam()  { printf '%s✓%s %s\n' "$YESIL" "$SIFIR" "$*"; }
uyari()  { printf '%s!%s %s\n' "$SARI" "$SIFIR" "$*"; }
hata()   { printf '%s✗%s %s\n' "$KIRMIZI" "$SIFIR" "$*" >&2; }
soluk()  { printf '%s%s%s\n' "$SOLUK" "$*" "$SIFIR"; }

# --- Windows tarafı --------------------------------------------------------

windows_var_mi() { command -v powershell.exe >/dev/null 2>&1; }

# PowerShell çıktısındaki satır sonu \r'leri temizler, yoksa değişkenler bozuk gelir.
ps_calistir() { powershell.exe -NoProfile -NonInteractive -Command "$1" 2>/dev/null | tr -d '\r'; }

# Varsayılan ağ geçidi olan arayüzün adresi — Wi-Fi/Ethernet değişse de doğru olanı bulur.
windows_lan_ip() {
  ps_calistir 'try { (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up" } | Select-Object -First 1).IPv4Address.IPAddress } catch { "" }' | head -1
}

yonlendirici_pid() {
  ps_calistir "Get-NetTCPConnection -LocalPort $LAN_PORT -State Listen -EA SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess" | head -1
}

# --- WSL tarafı ------------------------------------------------------------

# Yalnızca 4321'i dinleyeni hedefliyoruz: başka portta duran `astro dev`
# gibi süreçlere dokunmuyoruz.
wsl_port_pidleri() {
  ss -lptnH "sport = :$WSL_PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u
}

wsl_sunucusunu_durdur() {
  local pidler
  pidler=$(wsl_port_pidleri)
  [[ -z "$pidler" ]] && return 1

  for p in $pidler; do kill "$p" 2>/dev/null; done
  for _ in $(seq 1 20); do
    [[ -z "$(wsl_port_pidleri)" ]] && return 0
    sleep 0.25
  done
  # Nazik istek işe yaramadıysa zorla.
  for p in $(wsl_port_pidleri); do kill -9 "$p" 2>/dev/null; done
  sleep 0.5
  return 0
}

# --- Eylemler --------------------------------------------------------------

yonlendiriciyi_baslat() {
  local node_yolu win_temp temp_wsl
  node_yolu=$(ps_calistir '(Get-Command node -EA SilentlyContinue).Source' | head -1)
  if [[ -z "$node_yolu" ]]; then
    uyari "Windows tarafında node bulunamadı — LAN yönlendiricisi kurulamıyor."
    uyari "USB yolu (chrome://inspect) yine de çalışır."
    return 1
  fi

  win_temp=$(ps_calistir '$env:TEMP' | head -1)
  temp_wsl=$(wslpath -u "$win_temp" 2>/dev/null)
  if [[ -z "$temp_wsl" || ! -d "$temp_wsl" ]]; then
    uyari "Windows TEMP dizinine erişilemedi ($win_temp)."
    return 1
  fi

  # Betiği her seferinde yeniden yazıyoruz: eski bir kopya sessizce kalmasın.
  cat > "$temp_wsl/$YONLENDIRICI_JS" <<'JS'
// fishfish — LAN'dan gelen bağlantıları WSL'deki preview sunucusuna aktarır.
// Bu dosyayı dev.sh üretir; elle düzenlemenin anlamı yok.
const net = require('net');
const DINLE = Number(process.argv[2] || 4322);
const HEDEF = Number(process.argv[3] || 4321);

const sunucu = net.createServer((istemci) => {
  const yukari = net.connect(HEDEF, '127.0.0.1');
  const kapat = () => { istemci.destroy(); yukari.destroy(); };
  istemci.on('error', kapat);
  yukari.on('error', kapat);
  istemci.pipe(yukari);
  yukari.pipe(istemci);
});

sunucu.on('error', (e) => { console.error('HATA', e.message); process.exit(1); });
sunucu.listen(DINLE, '0.0.0.0', () => console.log(`dinliyor 0.0.0.0:${DINLE} -> 127.0.0.1:${HEDEF}`));
JS

  local win_js="$win_temp\\$YONLENDIRICI_JS"
  # Arka planda başlatıp sonucu yoklamayla doğruluyoruz: PowerShell'in dönüş
  # değeri sürecin gerçekten dinlemeye başladığını söylemiyor.
  powershell.exe -NoProfile -NonInteractive -Command \
    "Start-Process -FilePath '$node_yolu' -ArgumentList '$win_js',$LAN_PORT,$WSL_PORT -WindowStyle Hidden -RedirectStandardOutput '$win_temp\\fishfish-yonlendirici.log' -RedirectStandardError '$win_temp\\fishfish-yonlendirici.err'" \
    >/dev/null 2>&1 </dev/null &

  for _ in $(seq 1 24); do
    [[ -n "$(yonlendirici_pid)" ]] && return 0
    sleep 0.5
  done
  hata "Yönlendirici $LAN_PORT portunu dinlemeye başlamadı."
  soluk "  Ayrıntı: $win_temp\\fishfish-yonlendirici.err"
  return 1
}

yonlendiriciyi_durdur() {
  local p
  p=$(yonlendirici_pid)
  [[ -z "$p" ]] && return 1
  ps_calistir "Stop-Process -Id $p -Force -EA SilentlyContinue" >/dev/null
  sleep 0.5
  return 0
}

komut_dur() {
  bilgi "${KALIN}Kapatılıyor${SIFIR}"
  if wsl_sunucusunu_durdur; then tamam "WSL preview sunucusu ($WSL_PORT) kapatıldı"
  else soluk "  $WSL_PORT'te çalışan sunucu yoktu"; fi

  if windows_var_mi; then
    if yonlendiriciyi_durdur; then tamam "Windows yönlendiricisi ($LAN_PORT) kapatıldı"
    else soluk "  $LAN_PORT'te çalışan yönlendirici yoktu"; fi
  fi
}

komut_durum() {
  local pidler yp ip
  bilgi "${KALIN}Durum${SIFIR}"

  pidler=$(wsl_port_pidleri)
  if [[ -n "$pidler" ]]; then tamam "WSL preview çalışıyor (port $WSL_PORT, pid $(echo "$pidler" | tr '\n' ' '))"
  else uyari "WSL preview çalışmıyor"; fi

  if windows_var_mi; then
    yp=$(yonlendirici_pid)
    if [[ -n "$yp" ]]; then tamam "Windows yönlendiricisi çalışıyor (port $LAN_PORT, pid $yp)"
    else uyari "Windows yönlendiricisi çalışmıyor"; fi

    ip=$(windows_lan_ip)
    if [[ -n "$ip" ]]; then
      # Zinciri gerçekten deneyerek doğruluyoruz — dinleyen bir port,
      # çalışan bir zincir demek değil.
      if curl -sf -o /dev/null --max-time 6 "http://$ip:$LAN_PORT/"; then
        tamam "Zincir sağlam: http://$ip:$LAN_PORT yanıt veriyor"
      else
        uyari "http://$ip:$LAN_PORT yanıt vermiyor"
      fi
    fi
  fi
}

komut_basla() {
  local derle=1
  [[ "${1:-}" == "--hizli" ]] && derle=0

  cd "$PROJE" || { hata "Proje dizinine girilemedi: $PROJE"; exit 1; }
  mkdir -p "$GUNLUK_DIZINI"

  bilgi "${KALIN}Eski süreçler${SIFIR}"
  if wsl_sunucusunu_durdur; then tamam "$WSL_PORT portundaki eski sunucu kapatıldı"
  else soluk "  $WSL_PORT boştu"; fi

  if [[ $derle -eq 1 ]]; then
    bilgi ""
    bilgi "${KALIN}Derleme${SIFIR}"
    # Telefon testi üretim çıktısı ister: service worker yalnızca orada kaydolur.
    if ! npm run build 2>&1 | tail -3; then
      hata "Derleme başarısız."
      exit 1
    fi
  else
    soluk "  derleme atlandı (--hizli)"
    [[ -d dist ]] || { hata "dist/ yok — --hizli kullanma, önce derle."; exit 1; }
  fi

  bilgi ""
  bilgi "${KALIN}Sunucu${SIFIR}"
  nohup npm run preview -- --host 0.0.0.0 --port "$WSL_PORT" > "$SUNUCU_GUNLUGU" 2>&1 &
  disown

  local hazir=0
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null --max-time 2 "http://localhost:$WSL_PORT/"; then hazir=1; break; fi
    sleep 0.5
  done
  if [[ $hazir -eq 0 ]]; then
    hata "Sunucu açılmadı. Günlük: $SUNUCU_GUNLUGU"
    tail -20 "$SUNUCU_GUNLUGU" 2>/dev/null
    exit 1
  fi
  tamam "WSL preview ayakta (port $WSL_PORT)"

  local ip='' yonlendirici_tamam=0
  if windows_var_mi; then
    bilgi ""
    bilgi "${KALIN}LAN yönlendiricisi${SIFIR}"
    if [[ -n "$(yonlendirici_pid)" ]]; then
      tamam "Zaten çalışıyor (port $LAN_PORT) — Windows süreci, WSL yeniden başlasa da yaşıyor"
      yonlendirici_tamam=1
    elif yonlendiriciyi_baslat; then
      tamam "Başlatıldı (port $LAN_PORT)"
      yonlendirici_tamam=1
    fi
    ip=$(windows_lan_ip)
  fi

  bilgi ""
  bilgi "${KALIN}Adresler${SIFIR}"
  bilgi "  USB (chrome://inspect port yönlendirmesi): ${KALIN}http://localhost:$WSL_PORT${SIFIR}"
  if [[ $yonlendirici_tamam -eq 1 && -n "$ip" ]]; then
    if curl -sf -o /dev/null --max-time 6 "http://$ip:$LAN_PORT/"; then
      bilgi "  LAN (aynı ağdaki telefon):                 ${KALIN}http://$ip:$LAN_PORT${SIFIR}"
      bilgi ""
      soluk "  LAN adresi https olmadığı için service worker, konum ve kurulum"
      soluk "  varsayılan olarak çalışmaz. Telefonda Chrome > chrome://flags >"
      soluk "  \"Insecure origins treated as secure\" alanına şunu yaz:"
      bilgi "      ${KALIN}http://$ip:$LAN_PORT${SIFIR}"
      soluk "  Enabled yap, Relaunch de. Doğrulama: /noktalar sayfasında"
      soluk "  \"Konumuma göre sırala\" düğmesi görünüyorsa güvenli bağlam aktif."
    else
      uyari "http://$ip:$LAN_PORT yanıt vermedi — güvenlik duvarı engelliyor olabilir."
    fi
  fi

  bilgi ""
  soluk "  Sunucu günlüğü: $SUNUCU_GUNLUGU"
  soluk "  Kapatmak için:  ./dev.sh dur"
}

case "${1:-basla}" in
  basla)   komut_basla "${2:-}" ;;
  --hizli) komut_basla --hizli ;;
  dur)     komut_dur ;;
  durum)   komut_durum ;;
  -h|--yardim|yardim)
    sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    ;;
  *) hata "Bilinmeyen komut: $1"; bilgi "Kullanım: ./dev.sh [basla|--hizli|dur|durum]"; exit 1 ;;
esac
