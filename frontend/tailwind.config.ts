import type { Config } from 'tailwindcss'

/** Source of truth for design tokens is @theme in src/styles/globals.css (Tailwind v4).
 *  The aliases below exist so `bg-parchment`, `text-ink`, etc. still resolve in class
 *  scanning without blocking content purge. */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#e8dcc0',
        'parchment-light': '#f0e4c8',
        'parchment-dark': '#d9c9a3',
        'parchment-deep': '#c8b690',
        ink: '#1a1410',
        'ink-soft': '#3a2a1a',
        sepia: '#6b4820',
        'sepia-muted': '#8a6c3e',
        'wax-red': '#8b1a1a',
        'wax-red-dark': '#6b1010',
        gold: '#b8860b',
        'gold-tarnish': '#8b6914',
        forest: '#3d5a2a',
        bruise: '#4a2a3a',
      },
      fontFamily: {
        display: ['Cinzel', 'Times New Roman', 'serif'],
        body: ['"IM Fell English"', '"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Courier Prime"', 'ui-monospace'],
      },
    },
  },
} satisfies Config
