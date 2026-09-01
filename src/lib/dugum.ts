/**
 * Düğüm kategorileri — düğümün hangi işi gördüğü.
 *
 * Zorluk sıralaması "hangi düğümü öğreneyim" sorusunu cevaplıyor ama
 * "iğneyi neyle bağlayacağım" sorusunu cevaplamıyordu. Kategori bu ikinci
 * ekseni taşır: liste sayfası düğümleri işe göre gruplar, grup içinde
 * zorluğa göre sıralar.
 *
 * Üç kategori var çünkü ikisi yetmiyor: köstek bağı ve çift ilmek ne bir
 * halkaya bağlanır ne iki hattı birleştirir — hattın ucunda veya ortasında
 * ilmek bırakır. Bazı düğümler (uni) iki işi birden görür; kategori birincil
 * işidir, ikincisi düğümün `kullanim` alanında yazar.
 */
export const DUGUM_KATEGORILERI = [
  {
    id: 'halka',
    ad: 'Halkaya ve İğneye Bağlama',
    not: 'Misinanın ucunu iğneye, fırdöndüye, klipse veya zokaya bağlar. Her takımda en az bir tane kullanırsın.',
  },
  {
    id: 'hat',
    ad: 'İki Hattı Birleştirme',
    not: 'İki misinayı uç uca ekler: ana misina ile lider ya da ana misina ile köstek arasındaki bağlantı budur.',
  },
  {
    id: 'ilmek',
    ad: 'İlmek Yapma',
    not: 'Hattı kesmeden ilmek bırakır. Köstek bu ilmekten çıkar, hazır takımlar buradan takılıp sökülür.',
  },
] as const;

export type DugumKategorisi = (typeof DUGUM_KATEGORILERI)[number]['id'];

/** Ham kategori değerini ekrana basma; her zaman buradan geçir. */
export function dugumKategoriAdi(id: string): string {
  return DUGUM_KATEGORILERI.find((k) => k.id === id)?.ad ?? id;
}
