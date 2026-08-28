/**
 * İkon yolları. Hem sunucuda basılan `Ikon.astro` hem de tarayıcıda
 * çalışan hava paneli aynı kaynağı kullansın diye burada.
 * Hepsi 24×24 kutuda, currentColor ile çizilir.
 */
export const IKONLAR: Record<string, string> = {
  // Nokta özellikleri
  isik: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V17h5.4v-1.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/>',
  otopark: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M9.5 17V7.5h3.2a2.9 2.9 0 0 1 0 5.8H9.5"/>',
  kalabalik: '<circle cx="8.5" cy="8" r="2.6"/><circle cx="16" cy="9" r="2.1"/><path d="M3.5 19c0-2.8 2.2-4.6 5-4.6s5 1.8 5 4.6"/><path d="M14.6 14.8c2.4-.5 5.9.6 5.9 4.2"/>',
  gece: '<path d="M20 14.4A8.3 8.3 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4Z"/>',
  orkoz: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.5 4v4.2h-4.2"/><path d="M8.5 12a3.5 3.5 0 1 0 3.5-3.5"/>',
  // Nokta tipleri
  mendirek: '<path d="M2.5 17h19"/><rect x="4" y="12" width="4" height="5"/><rect x="10" y="9.5" width="4" height="7.5"/><rect x="16" y="12" width="4" height="5"/>',
  iskele: '<path d="M2.5 9.5h19"/><path d="M6 9.5V18M12 9.5V18M18 9.5V18"/><path d="M2.5 21c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0"/>',
  kayalik: '<path d="M2.5 19 8 9l4 6 3-4.5L21.5 19Z"/><path d="M8 9l4 10"/>',
  plaj: '<path d="M2.5 15c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0"/><path d="M2.5 19.5c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0"/><circle cx="17.5" cy="6.5" r="2.6"/>',
  kopru: '<path d="M2.5 15h19"/><path d="M2.5 15c0-5.2 4.3-8 9.5-8s9.5 2.8 9.5 8"/><path d="M12 7v8M7 9.4V15M17 9.4V15"/>',
  rihtim: '<path d="M2.5 13.5h19v3h-19z"/><path d="M6 16.5v4M18 16.5v4"/><path d="M2.5 9c2.5-2 5-2 7.5 0"/>',
  koy: '<path d="M3 4c0 7 4 10 9 10s9-3 9-10"/><path d="M2.5 19c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0"/>',
  sazlik: '<path d="M2.5 20c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0"/><path d="M7 17.5V9.5M12 17.5V6M17 17.5v-6.5"/><rect x="5.9" y="5.3" width="2.2" height="4.2" rx="1.1"/><rect x="10.9" y="2.5" width="2.2" height="3.6" rx="1.1"/><rect x="15.9" y="6.8" width="2.2" height="4.2" rx="1.1"/>',
  'dere-kenari': '<path d="M5 3.5c0 4 3.5 4.5 3.5 8.5S5 16.5 5 20.5"/><path d="M19 3.5c0 4-3.5 4.5-3.5 8.5s3.5 4.5 3.5 8.5"/><path d="M11 8.5h2.5M10.5 13h3M11 17.5h2.5"/>',
  // Hava ve deniz
  ruzgar: '<path d="M3 8.5h10.5a2.75 2.75 0 1 0-2.75-2.75"/><path d="M3 13h14a3 3 0 1 1-3 3"/><path d="M3 17.5h7.5a2.25 2.25 0 1 1-2.25 2.25"/>',
  dalga: '<path d="M2.5 8.5c1.6-1.3 3.2-1.3 4.8 0s3.2 1.3 4.8 0 3.2-1.3 4.8 0 3.2 1.3 4.6 0"/><path d="M2.5 13.5c1.6-1.3 3.2-1.3 4.8 0s3.2 1.3 4.8 0 3.2-1.3 4.8 0 3.2 1.3 4.6 0"/><path d="M2.5 18.5c1.6-1.3 3.2-1.3 4.8 0s3.2 1.3 4.8 0 3.2-1.3 4.8 0 3.2 1.3 4.6 0"/>',
  sicaklik: '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9.5v6"/>',
  basinc: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12 15.5 8.5"/><path d="M12 3.5v1.5M20.5 12H19M12 20.5V19M3.5 12H5"/>',
  gunes: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3"/>',
  saat: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/>',
  // Genel
  balik: '<path d="M15.5 12c0 3-4.5 5.5-8 5.5S2.5 15 2.5 12 4 6.5 7.5 6.5s8 2.5 8 5.5Z"/><path d="M15.5 12 21.5 8v8Z"/><circle cx="6.2" cy="10.8" r=".9" fill="currentColor" stroke="none"/>',
  konum: '<path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10.3" r="2.6"/>',
  ulasim: '<rect x="5" y="3.5" width="14" height="13" rx="3"/><path d="M5 11.5h14"/><circle cx="8.6" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="14" r="1" fill="currentColor" stroke="none"/><path d="M7.5 16.5 5.5 20.5M16.5 16.5l2 4"/>',
  uyari: '<path d="M12 3.8 21.2 19.5H2.8Z"/><path d="M12 9.8v4.4"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
  yasak: '<circle cx="12" cy="12" r="8.5"/><path d="M6 18 18 6"/>',
  dukkan: '<path d="M4 9.5h16V20H4Z"/><path d="M3 9.5 5 4h14l2 5.5"/><path d="M9.5 20v-5.5h5V20"/>',
  pusula: '<circle cx="12" cy="12" r="8.5"/><path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5Z"/>',
  // Gezinme — alt sekme çubuğu ve menü sayfası
  takvim: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10.2h17"/><path d="M8 3v4M16 3v4"/>',
  menu: '<rect x="3.5" y="3.5" width="7" height="7"/><rect x="13.5" y="3.5" width="7" height="7"/><rect x="3.5" y="13.5" width="7" height="7"/><rect x="13.5" y="13.5" width="7" height="7"/>',
  takim: '<path d="M12 3.5v8a4.5 4.5 0 1 1-4.5 4.5"/><path d="M9 3.5h6"/>',
  dugum: '<path d="M6.5 17.5c6.5-1 4-9.5 11-10.5"/><path d="M17.5 17.5c-6.5-1-4-9.5-11-10.5"/>',
  ekipman: '<path d="m3.5 20.5 12-12"/><path d="m14 5.5 4.5 4.5"/><path d="M16.5 3 21 7.5"/><circle cx="7.5" cy="16.5" r="2.4"/>',
  // Çift oklu tazeleme simgesi. `orkoz` de dairesel bir oktur ama tek yay +
  // içeride girdap taşır; ikisi karışmasın diye bu iki yaylı çizildi.
  yenile: '<path d="M20.3 11.2A8.3 8.3 0 0 0 6.4 6.6L3.9 9.1"/><path d="M3.6 4.4v4.8h4.8"/><path d="M3.7 12.8a8.3 8.3 0 0 0 13.9 4.6l2.5-2.5"/><path d="M20.4 19.6v-4.8h-4.8"/>',
  filtre: '<path d="M3.5 5.5h17l-6.6 7.6V20l-3.8-2.4v-4.5Z"/>',
  ekle: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M12 8.5v7M8.5 12h7"/>',
  yontem: '<path d="M14 3.5v7a4.5 4.5 0 1 1-4.5 4.5"/><path d="M11 3.5h6"/><path d="M3.5 8c1.8 1.6 1.8 4.4 0 6"/>',
  // Yöntem simgeleri — /yontem sayfaları ve nokta rozetleri
  'dip-yemli': '<path d="M2.5 19.5h19"/><path d="M12 3.5v9"/><path d="M9.6 12.5h4.8l-1.1 5.2h-2.6Z"/>',
  samandirali: '<path d="M12 2.5v6"/><path d="M12 8.5c2.4 0 4 2.2 4 5s-1.6 5-4 5-4-2.2-4-5 1.6-5 4-5Z"/><path d="M2.5 13.5h5.2M16.3 13.5h5.2"/>',
  capari: '<path d="M7 3v18"/><path d="M7 7.5h3.6M7 12h3.6M7 16.5h3.6"/><circle cx="12.6" cy="7.5" r="1.5"/><circle cx="12.6" cy="12" r="1.5"/><circle cx="12.6" cy="16.5" r="1.5"/>',
  'ac-cek': '<path d="M3.5 8.5c5-3.2 11-3.2 16 0"/><path d="M19.5 8.5v-4M19.5 8.5h-4"/><path d="M20.5 15.5c-5 3.2-11 3.2-16 0"/><path d="M4.5 15.5v4M4.5 15.5h4"/>',
  spin: '<path d="M11.5 2.5v8.5"/><ellipse cx="14.4" cy="7.5" rx="2.5" ry="4"/><path d="M11.5 11v4.5"/><path d="M9 15.5h5l-2.5 5Z"/>',
  lrf: '<circle cx="7.5" cy="9" r="2.6"/><path d="M7.5 3.5v2.9"/><path d="M10.1 9c3.4 0 5.6 1.7 5.6 3.9S13.4 16.5 11.7 16.5"/>',
  egi: '<path d="M20.5 7.5C16 5.8 10.6 7 7.4 10.9 5.9 12.8 5.3 14.6 5.3 16.5"/><path d="M5.3 16.5 2.4 15M5.3 16.5l-.9 3M5.3 16.5l2.3 2.4"/><circle cx="18.6" cy="8.2" r=".9" fill="currentColor" stroke="none"/>',
  surf: '<path d="M2.5 19.5c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0"/><path d="M3 15.5C6.6 6.4 13.4 3 20.8 3.4"/><path d="m20.8 3.4-4.2 1.3M20.8 3.4l-.5 4.3"/>',
  feeder: '<rect x="8" y="6.5" width="8" height="10" rx="1.5"/><path d="M8 10h8M8 13.2h8M11 6.5v10M14 6.5v10"/><path d="M12 2.5v4M12 16.5v4"/>',
  sozluk: '<path d="M3.5 4.5h5.5a3 3 0 0 1 3 3V20a2.6 2.6 0 0 0-2.6-2H3.5Z"/><path d="M20.5 4.5H15a3 3 0 0 0-3 3V20a2.6 2.6 0 0 1 2.6-2h5.9Z"/>',
};

/** Tarayıcıda kullanmak için hazır <svg> dizesi üretir. */
export function ikonSvg(ad: string, sinif = 'size-4'): string {
  const govde = IKONLAR[ad] ?? IKONLAR.pusula!;
  return `<svg class="${sinif}" viewBox="0 0 24 24" fill="none" stroke="currentColor"`
    + ` stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`
    + ` aria-hidden="true" focusable="false">${govde}</svg>`;
}
