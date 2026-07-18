/**
 * Configura Tailwind CSS y los tokens visuales principales de Kotta.
 * Se relaciona con las clases usadas por la landing, paneles por rol y componentes compartidos.
 * Existe para mantener colores, tipografias, espaciados y animaciones consistentes.
 * 
 * FUENTE ÚNICA DE VERDAD — globals.css consume estos tokens via @apply.
 * No duplicar valores en :root de CSS.
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Primarios --------------------
        black: '#000000',
        white: '#FFFFFF',

        // --- Acentos de marca ------------------
        red:    '#FD5F56',
        yellow: '#FFBA2E',
        green:  '#2BC842',

        // --- Neutrales --------------------
        neutral: {
          100: '#EDEDED', // bordes suaves, fondos de input
          200: '#D5DEEF', // superficies de card, hover sutil
          400: '#A6A6A6', // texto secundario, placeholder
          800: '#30302E', // texto sobre fondo blanco (variante)
          900: '#262624', // texto principal oscuro
        },

        // ── Estados funcionales (alias semánticos) ───────────────
        success: '#2BC842',
        warning: '#FFBA2E',
        danger:  '#FD5F56',

        // ── Tokens del sistema anterior migrados ─────────────────
        // (antes vivían en :root de globals.css como --navy, --sky, etc.)
        navy:    '#1E3A5F',
        sky:     '#4FA8E8',
        'sky-lt': '#E8F4FD',
        bg:      '#F7F9FC',

        // ── Texto semántico ──────────────────────────────────────
        text: {
          primary:   '#0F1F34',
          secondary: '#4A5568',
          muted:     '#6B7A99',
        },

        // ── Borde global ─────────────────────────────────────────
        border: '#E2E8F0',
      },

      fontFamily: {
        // Clase: font-gotham
        // Requiere variable CSS --font-gotham desde next/font/local en layout.tsx
        gotham: ['var(--font-gotham)', 'Gotham', 'sans-serif'],
        mono:   ['var(--font-mono)',   'monospace'],
      },

      fontSize: {
        '5xl': ['3rem',    { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '1.0',  letterSpacing: '-0.04em' }],
        '7xl': ['4.5rem',  { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        '8xl': ['6rem',    { lineHeight: '0.9',  letterSpacing: '-0.05em' }],
        '9xl': ['8rem',    { lineHeight: '0.85', letterSpacing: '-0.06em' }],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '28': '7rem',
        '36': '9rem',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)',
        'black':      '0 8px 32px rgba(0,0,0,0.16)',
        'navy':       '0 8px 24px rgba(30,58,95,0.22)',
        'sky':        '0 8px 24px rgba(79,168,232,0.3)',
      },

      animation: {
        'fade-up':    'fadeUp 0.6s ease forwards',
        'fade-in':    'fadeIn 0.5s ease forwards',
        'float':      'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },

      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config