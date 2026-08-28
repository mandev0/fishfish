# Statik site: Node ile derlenir, çıktı nginx ile servis edilir.
# Çalışan imajda Node yok — yalnızca dist/ ve nginx kalır.

# --- Derleme ---------------------------------------------------------
FROM node:22-alpine AS derleme

WORKDIR /app

# Önce yalnızca bağımlılık dosyaları: kaynak değiştiğinde bu katman
# önbellekten gelir ve npm ci yeniden çalışmaz.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Derlemeden önce veriyi denetle. Bozuk bir çapraz referans veya kaynaksız
# yasal kayıt üretime çıkmasın diye; ikisi de birkaç saniye sürüyor.
RUN npm run validate \
 && npm run test \
 && npm run build

# --- Çalışma ---------------------------------------------------------
FROM nginx:1.27-alpine AS calisma

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Temel imajın örnek sayfaları (index.html, 50x.html) burada duruyor; siteyle
# karışmasın diye dizini boşaltıp yalnızca derleme çıktısını koyuyoruz.
RUN rm -rf /usr/share/nginx/html/*
COPY --from=derleme /app/dist /usr/share/nginx/html

EXPOSE 80

# Sağlık yoklaması sayfa değil, ayrı bir uç nokta okur: HTML'i her seferinde
# okumak günlükleri kirletiyor.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
