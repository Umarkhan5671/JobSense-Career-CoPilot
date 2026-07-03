/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fcfaf2',
          100: '#f7f1db',
          200: '#eddcb3',
          500: '#d97706',
          600: '#c5a880', // Refined bronze/gold
          700: '#a38458',
          gold: '#dfb76c',
          bronze: '#c5a880',
        },
        dark: {
          base: '#0b0f17',
          panel: '#121824',
          card: '#161f30',
          border: '#242f47',
          accent: '#c5a880',
        }
      }
    },
  },
  plugins: [],
}
