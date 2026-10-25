/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // NVIDIA Green (#76b900), Pitch Black & Clean White Palette
        primary: {
          DEFAULT: '#76b900',
          hover: '#8cd600',
          glow: 'rgba(118, 185, 0, 0.4)',
          50: '#f4fbe8',
          100: '#e6f7cb',
          200: '#d0efa0',
          300: '#b4e36d',
          400: '#98d438',
          500: '#76b900',
          600: '#8cd600',
          700: '#5c9200',
          800: '#3d5e07',
          900: '#344f0a',
        },
        dark: {
          DEFAULT: '#09090b',
          900: '#000000',
          800: '#121216',
          700: '#18181f',
          600: '#272730',
        },
        card: '#121216',
        accent: '#76b900',

        // Unified Cinema / Prime Classes Mapped Directly to NVIDIA Green & Black
        prime: {
          darkest: '#000000', // Pitch Black
          dark: '#0a0a0a',    // Dark obsidian surface
          surface: '#121216', // Dark card panel
          card: '#121216',
          cardHover: '#1c1c24',
          border: '#27272a',  // Subtle zinc border
          blue: '#76b900',    // Signature NVIDIA Green
          blueHover: '#8cd600',
          blueDark: '#5c9200',
          gold: '#76b900',    // NVIDIA Green Accent
          muted: '#a1a1aa',   // Muted slate text
        },
        cinema: {
          darkest: '#000000',
          dark: '#0a0a0a',
          surface: '#121216',
          card: '#121216',
          border: '#27272a',
          red: '#76b900',      // Signature NVIDIA Green
          redHover: '#8cd600',
          gold: '#76b900',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-prime': '0 0 25px -4px rgba(118, 185, 0, 0.45)',
        'glow-cyan': '0 0 20px -3px rgba(118, 185, 0, 0.4)',
        'glow-orange': '0 0 25px -4px rgba(118, 185, 0, 0.45)',
        'glow-green': '0 0 25px -4px rgba(118, 185, 0, 0.45)',
        'glow-gold': '0 0 20px -3px rgba(118, 185, 0, 0.4)',
        'orange-glow': '0 0 25px rgba(118, 185, 0, 0.35)',
        'orange-sm': '0 0 12px rgba(118, 185, 0, 0.25)',
        'nvidia-glow': '0 0 25px rgba(118, 185, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
