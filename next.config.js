const path = require('path');
const { i18n } = require('./next-i18next.config.js');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
})


const nextConfig = {
  i18n,
  reactStrictMode: true,
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'api.ts'],
  sassOptions: {
    includePaths: [path.resolve(__dirname, 'src')],
    prependData: `@import 'styles/mixin.scss';`,
  },
  transpilePackages: ['antd-mobile'],
  async rewrites() {
    return [
      {
        source: '/.well-known/nostr.json',
        destination: '/api/.well-known/nostr.json',
      },
    ];
  },
}

module.exports = withBundleAnalyzer(withPWA(nextConfig));
