import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', dark: '#1d4ed8' },
        danger: { DEFAULT: '#dc2626', light: '#fef2f2' },
        warning: { DEFAULT: '#d97706', light: '#fffbeb' },
        success: { DEFAULT: '#16a34a', light: '#f0fdf4' },
      },
    },
  },
  plugins: [],
}

export default config
