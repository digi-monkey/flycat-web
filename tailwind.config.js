module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './.storybook/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // safeList: ['f-container', 'f-grid'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        noto: ['Noto Sans', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: '#598022',
        primary: {
          DEFAULT: '#183F00',
          900: '#183F00',
          800: '#2E5203',
          700: '#44661B',
          600: '#598022',
          500: '#739F36',
          400: '#98C354',
          300: '#C0E085',
          200: '#DDEEBA',
          100: '#FBFFF0',
        },
        gray: {
          900: '#1E1E1E',
          800: '#303030',
          700: '#454744',
          600: '#787878',
          500: '#8E8E8E',
          400: '#BCBCBC',
          300: '#D2D2D2',
          200: '#EDEDED',
          100: '#F9F9F9',
        },
        surface: {
          '01': '#F9F9F9',
          '01-accent': '#F2F2F2',
          '02': '#FFFFFF',
          '02-accent': '#EDEDED',
          '03': '#F7FAF5',
          '04': '#DDEEBA',
          inverse: '#1E1E1E',
        },
        text: {
          primary: '#1E1E1E',
          secondary: '#787878',
          tertiary: '#BCBCBC',
          placeholder: '#8E8E8E',
          inverse: '#FFFFFF',
          link: '#598022',
          inverseLink: '#C0E085',
          disabled: '#BCBCBC',
        },
        conditional: {
          hover01: `rgba(30, 30, 30, 0.08)`,
          selected01: '#FBFFF0',
          selected02: '#C0E085',
        },
      },
    },
  },
  plugins: [],
};
