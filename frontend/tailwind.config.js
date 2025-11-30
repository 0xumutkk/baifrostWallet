/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        baifrost: {
          // Baifrost brand colors
          orange: '#FF8C00',      // Warm yellow-orange
          teal: '#40E0D0',         // Cool light teal
          'teal-light': '#48D1CC', // Medium turquoise
          'teal-dark': '#20B2AA',  // Light sea green
          beige: '#FAF0E6',        // Light beige/off-white
          'blue-green': '#00CED1', // Dark turquoise
          // Gradient combinations
          gradient: {
            start: '#FF8C00',      // Orange start
            mid: '#FFA500',        // Yellow-orange
            end: '#40E0D0',        // Teal end
          },
        },
        cyber: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        neon: {
          pink: '#ff006e',
          cyan: '#00f5ff',
          green: '#00ff41',
          purple: '#b026ff',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #40E0D0, 0 0 10px #40E0D0' },
          '100%': { boxShadow: '0 0 20px #40E0D0, 0 0 30px #40E0D0' },
        },
        'glow-orange': {
          '0%': { boxShadow: '0 0 5px #FF8C00, 0 0 10px #FF8C00' },
          '100%': { boxShadow: '0 0 20px #FF8C00, 0 0 30px #FF8C00' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gradient-baifrost': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 50%, #40E0D0 100%)',
        'gradient-baifrost-horizontal': 'linear-gradient(90deg, #FF8C00 0%, #FFA500 50%, #40E0D0 100%)',
      },
    },
  },
  plugins: [],
}

