/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          light: '#FAF9F5',
          DEFAULT: '#F3F2EC',
          dark: '#E5E4DC',
          border: '#D8D6CA'
        },
        graphite: {
          950: '#131512',
          900: '#1A1D18',
          850: '#20241E',
          800: '#252923',
          700: '#32372F',
          600: '#434A3E',
          500: '#5C6457',
          400: '#868F80',
          300: '#B0B8AA',
          200: '#D5D9D1',
          100: '#E9EBE7'
        },
        olive: {
          DEFAULT: '#69745D',
          light: '#818E73',
          dark: '#515B47',
          dim: '#2A3326',
          border: '#3F4938'
        },
        rust: {
          DEFAULT: '#A65F43',
          light: '#C07355',
          dark: '#85462F',
          dim: '#38221B',
          border: '#5C3426'
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
