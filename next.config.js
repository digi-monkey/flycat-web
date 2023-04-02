const { i18n } = require('./next-i18next.config.js')

const nextConfig = {
  i18n,
  reactStrictMode: true,
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'api.ts'],
}

module.exports = nextConfig
