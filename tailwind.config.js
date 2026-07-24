/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#101114',
          soft: '#2A2C31',
          muted: '#4B4E55',
        },
        paper: '#F6F6F3',
        surface: '#FFFFFF',
        line: '#E4E3DE',
        gold: {
          50: '#FBF7ED',
          100: '#F3E9CC',
          300: '#DCC189',
          DEFAULT: '#B4883E',
          600: '#96702F',
          700: '#7A5A26',
        },
        pine: {
          50: '#EAF2F0',
          DEFAULT: '#1F5D53',
          600: '#194B43',
          700: '#123832',
        },
        rust: {
          DEFAULT: '#B3432B',
          50: '#FBEEEA',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,17,20,0.04), 0 12px 32px -12px rgba(16,17,20,0.18)',
        pop: '0 8px 24px -6px rgba(180,136,62,0.35)',
      },
      backgroundImage: {
        'perforation': 'radial-gradient(circle, transparent 4px, #F6F6F3 4.5px)',
      },
      backgroundSize: {
        'perforation-size': '16px 16px',
      },
      keyframes: {
        drive: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(calc(100% - 1.5rem))' },
        },
        riseIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        drive: 'drive 900ms cubic-bezier(0.65,0,0.35,1) forwards',
        riseIn: 'riseIn 400ms ease-out forwards',
      },
    },
  },
  plugins: [],
}
