/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta industrial para Codelco
        'codelco': {
          primary: '#1e3a8a', // Azul oscuro corporativo
          secondary: '#374151', // Gris industrial
          accent: '#ea580c', // Naranja acento
          light: '#f8fafc', // Gris muy claro
          dark: '#0f172a' // Azul muy oscuro
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
