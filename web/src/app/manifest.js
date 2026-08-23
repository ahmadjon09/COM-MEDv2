// PWA manifest — mobil qurilmalarda "ilova" ko'rinishi va tezroq qayta ochilish.
export default function manifest() {
  return {
    name: 'COM MEDICAL SERVIS — tibbiy apparatlar xizmati',
    short_name: 'COM MED',
    description: 'Tibbiy apparatlarni ta\'mirlash, diagnostika, kalibrovka va original zapchastlar',
    start_url: '/uz',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e90ff',
    lang: 'uz',
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
