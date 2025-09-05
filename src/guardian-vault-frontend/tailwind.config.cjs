/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './extension/**/*.{html,js}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      colors: {
        brand: {
          primary: '#29ABE2',
          secondary: '#1E40AF',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#29ABE2',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          gold: '#F59E0B',
          green: '#10B981',
          red: '#EF4444',
        },
        neutral: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        // Legacy support
        ink: '#0F172A',
        paper: '#1E293B',
        brand: '#29ABE2',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #29ABE2, #1E40AF)',
        'gradient-gold': 'linear-gradient(135deg, #F59E0B, #D97706)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(41, 171, 226, 0.3)',
        'glow-lg': '0 0 30px rgba(41, 171, 226, 0.4)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse 2s ease-in-out infinite',
        'bounce-slow': 'bounce 3s infinite',
        'gradient': 'gradientShift 15s ease infinite',
        'skeleton': 'loading 1.5s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-light': {
          background: 'rgba(248, 250, 252, 0.05)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #29ABE2, #1E40AF)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
      };
      addUtilities(newUtilities);
    }
  ],
};
