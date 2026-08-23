/**
 * Dizayn tizimi — "texnik katalog / datasheet" yo'nalishi.
 * Gradient blob va shisha effektlardan voz kechildi: ingichka chiziqlar,
 * o'tkir burchaklar, mono yorliqlar, zich jadval ritmi.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '820px',
      lg: '1080px',
      xl: '1400px',
      '2xl': '1760px',
      ultra: '2100px',
    },
    extend: {
      colors: {
        // Yagona akcent — dodgerblue. Faqat tekis rang sifatida ishlatiladi.
        blue: {
          50: '#f0f7ff',
          100: '#dcecff',
          200: '#b9d9ff',
          300: '#84beff',
          400: '#4aa2ff',
          500: '#1e90ff',
          600: '#0a72e0',
          700: '#0959b0',
          800: '#0b4988',
          900: '#0d3c6d',
          950: '#082647',
        },
        // Neytral shkala — sovuq kulrang (tibbiy oq qog'oz hissi)
        ink: {
          0: '#ffffff',
          25: '#fbfcfd',
          50: '#f5f7f9',
          100: '#eceff3',
          150: '#e3e7ee',   // hairline
          200: '#d5dae3',
          300: '#b3bbc8',
          400: '#8892a3',
          500: '#657084',
          600: '#4d5768',
          700: '#3a4351',
          800: '#252c37',
          900: '#141920',
          950: '#0a0d12',
        },
        ok: '#0f9d76',      // omborda bor
        warn: '#c2740a',    // buyurtma asosida
        danger: '#c2410c',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Mono mikro-yorliqlar
        label: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.09em' }],
        micro: ['0.75rem', { lineHeight: '1.15rem', letterSpacing: '0.02em' }],
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.875rem', { lineHeight: '1.45rem' }],
        base: ['0.9375rem', { lineHeight: '1.62rem' }],
        lg: ['1.0625rem', { lineHeight: '1.7rem' }],
        xl: ['1.1875rem', { lineHeight: '1.72rem', letterSpacing: '-0.011em' }],
        '2xl': ['1.4375rem', { lineHeight: '1.9rem', letterSpacing: '-0.018em' }],
        '3xl': ['1.75rem', { lineHeight: '2.15rem', letterSpacing: '-0.024em' }],
        '4xl': ['2.125rem', { lineHeight: '2.4rem', letterSpacing: '-0.03em' }],
        '5xl': ['2.75rem', { lineHeight: '2.95rem', letterSpacing: '-0.035em' }],
        '6xl': ['3.5rem', { lineHeight: '3.6rem', letterSpacing: '-0.042em' }],
        '7xl': ['4.5rem', { lineHeight: '4.5rem', letterSpacing: '-0.05em' }],
      },
      spacing: {
        4.5: '1.125rem', 7.5: '1.875rem', 13: '3.25rem', 15: '3.75rem',
        18: '4.5rem', 22: '5.5rem', 26: '6.5rem', 30: '7.5rem',
      },
      maxWidth: { container: '2100px', text: '64ch' },
      borderRadius: {
        none: '0', xs: '2px', sm: '3px', DEFAULT: '4px', md: '5px', lg: '6px', xl: '8px', pill: '999px',
      },
      borderColor: { DEFAULT: '#e3e7ee' },
      boxShadow: {
        // Soyalar juda kam ishlatiladi — asosan chegara chiziqlar
        hair: '0 0 0 1px #e3e7ee',
        focus: '0 0 0 3px rgba(30,144,255,.18)',
        pop: '0 12px 32px -18px rgba(20,25,32,.35)',
        head: '0 1px 0 0 #e3e7ee',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.22,1,.36,1)',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
        sweep: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        blink: 'blink 2s ease-in-out infinite',
        sweep: 'sweep 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
