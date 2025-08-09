/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // A more professional and modern color palette
      colors: {
        // Primary background color for the app
        'primary': {
          DEFAULT: '#1a202c', // A deep, cool gray
          light: '#2d3748',   // A lighter shade for cards and elements
        },
        // Secondary color for accents and highlights
        'secondary': {
          DEFAULT: '#2dd4bf', // A vibrant teal/cyan
          dark: '#14b8a6',    // A darker shade for hover states
        },
        // Text colors for better readability and hierarchy
        'text-primary': colors.gray[200],   // Main text color
        'text-secondary': colors.gray[400], // Lighter text for subtitles
        'text-accent': '#2dd4bf',          // Accent text color for links
      },
      // Setting a professional font family
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
