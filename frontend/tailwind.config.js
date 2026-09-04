/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a3a5c',
        secondary: '#2d5a8c',
        accent: '#3498db',
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
      }
    },
  },
  plugins: [],
}
