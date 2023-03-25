const path = require('path')

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    localePath: path.resolve('./public/locales') // fix vercel see https://stackoverflow.com/a/73843336/6544410 and https://github.com/i18next/next-i18next/issues/1552#issuecomment-981156476
  },
}
