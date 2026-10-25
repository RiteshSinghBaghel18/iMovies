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
        // Vibrant Orange, Pitch Black & Clean White Palette
        primary: {
          DEFAULT: '#ff6600',
          hover: '#ff7700',
          glow: 'rgba(255, 102, 0, 0.35)',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6600',
          600: '#ff7700',
          700: '#ea580c',
          800: '#c2410c',
          900: '#9a3412',
        },
        dark: {
          DEFAULT: '#09090b',
          900: '#000000',
          800: '#121216',
          700: '#18181f',
          600: '#272730',
        },
        card: '#121216',
        accent: '#ff6600',

        // Unified Cinema / Prime Classes Mapped Directly to Orange & Black
        prime: {
          darkest: '#000000', // Pitch Black
          dark: '#0a0a0a',    // Dark obsidian surface
          surface: '#121216', // Dark card panel
          card: '#121216',
          cardHover: '#1c1c24',
          border: '#27272a',  // Subtle zinc border
          blue: '#ff6600',    // Signature Vibrant Orange
          blueHover: '#ff7700',
          blueDark: '#ea580c',
          gold: '#ffaa00',    // Warm Amber Gold
          muted: '#a1a1aa',   // Muted slate text
        },
        cinema: {
          darkest: '#000000',
          dark: '#0a0a0a',
          surface: '#121216',
          card: '#121216',
          border: '#27272a',
          red: '#ff6600',      // Signature Vibrant Orange
          redHover: '#ff7700',
          gold: '#ffaa00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-prime': '0 0 25px -4px rgba(255, 102, 0, 0.45)',
        'glow-cyan': '0 0 20px -3px rgba(255, 102, 0, 0.4)',
        'glow-orange': '0 0 25px -4px rgba(255, 102, 0, 0.45)',
        'glow-gold': '0 0 20px -3px rgba(255, 170, 0, 0.4)',
        'orange-glow': '0 0 25px rgba(255, 102, 0, 0.35)',
        'orange-sm': '0 0 12px rgba(255, 102, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
