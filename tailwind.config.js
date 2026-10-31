/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F0',
        line: '#E7E1D6',
        ink: '#1C2420',
        muted: '#5B635E',
        leaf: { DEFAULT: '#1F5E3B', dark: '#174A2E', soft: '#E8F1EB' },
        brick: { DEFAULT: '#C2552D', soft: '#F8E7DF' },
        slate2: { DEFAULT: '#2F5D8A', soft: '#E4ECF5' },
        sun: { DEFAULT: '#D99A1E', soft: '#FBF1DA' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
