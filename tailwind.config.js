/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wall: '#F4F6F5',
        surface: '#FFFFFF',
        'surface-raised': '#FAFBFA',
        line: '#D9E0DB',
        ink: '#16211C',
        muted: '#5E6B63',
        brand: {
          DEFAULT: '#124734',
          dark: '#0C3325',
          light: '#E4EFE9',
          muted: '#1A5A42',
        },
        ok: { DEFAULT: '#1E7A4C', light: '#E2F2E9' },
        low: { DEFAULT: '#B37400', light: '#FDF0D5' },
        out: { DEFAULT: '#B3312A', light: '#FBE6E4' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-sinhala)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        card: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(22 33 28 / 0.06), 0 1px 2px -1px rgb(22 33 28 / 0.06)',
        elevated: '0 10px 25px -5px rgb(22 33 28 / 0.1), 0 8px 10px -6px rgb(22 33 28 / 0.06)',
        focus: '0 0 0 3px rgb(18 71 52 / 0.2)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translate(-50%, 12px)' },
          to: { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
