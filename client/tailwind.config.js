/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcddff',
          300: '#8ec8ff',
          400: '#58a8ff',
          500: '#2f82ff',
          600: '#1762f5',
          700: '#0f4bd6',
          800: '#133eac',
          900: '#153787',
          950: '#112353',
        },
        navy: {
          800: '#111c34',
          900: '#0b1325',
          950: '#060a16',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', '"Latha"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
