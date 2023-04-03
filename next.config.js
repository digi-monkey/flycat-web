const path = require('path');
const { i18n } = require('./next-i18next.config.js');

const nextConfig = {
  i18n,
  reactStrictMode: true,
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'api.ts'],
  sassOptions: {
    includePaths: [path.resolve(__dirname, 'src')],
    prependData: `@import 'styles/mixin.scss';`,
  },
}

module.exports = nextConfig;