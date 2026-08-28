// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://fish.selimakpinar.com',
  output: 'static',
  // Bağlantılar görüş alanına girince önceden çekilir: sekmeler arası geçiş
  // ağ beklemeden açılır, uygulama hissi buradan geliyor.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  vite: {
    plugins: [tailwindcss()],
  },
});
