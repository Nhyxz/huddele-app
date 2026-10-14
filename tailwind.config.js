/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nhs: {
          blue: '#005EB8',
          darkblue: '#003087',
          deepnavy: '#002F6C',
          brightblue: '#0072CE',
          lightblue: '#41B6E6',
          aquablue: '#00A9CE',
          green: '#007F3B',
          lightgreen: '#00A499',
          amber: '#ED8B00',
          red: '#DA291C',
          darkred: '#8A1538',
          purple: '#6F42C1',
          palegrey: '#F0F4F5',
          midgrey: '#E8EDEE',
          darkgrey: '#425563',
          black: '#212B32',
        },
        los: {
          under2: '#007F3B',
          under3: '#CA8A04',
          under4: '#EA580C',
          under12: '#DC2626',
          over12: '#7C3AED',
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', '"Roboto"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
