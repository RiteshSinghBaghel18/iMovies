/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
          700: '#ff8800',
          800: '#ea580c',
          900: '#c2410c',
        },
        dark: {
          DEFAULT: '#09090b',
          900: '#000000',
          800: '#121216',
          700: '#18181f',
          600: '#272730',
        },
        darker: '#000000',
        card: '#0f0f13',
        accent: '#ff6600',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'orange-glow': '0 0 25px rgba(255, 102, 0, 0.35)',
        'orange-sm': '0 0 12px rgba(255, 102, 0, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'hero-vignette': 'radial-gradient(circle at center, transparent 0%, #000000 90%)',
      }
    }
  },
  plugins: []
};
