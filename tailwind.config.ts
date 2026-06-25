import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#C65D3B',
        accent: '#5B8C5A',
        surface: '#FAF6F1',
        ink: '#2E2A26',
      },
    },
  },
  plugins: [],
};

export default config;
