export const joyIdConfig = {
  name: 'flycat',
  logo: 'https://flycat.club/logo/app/512.svg',
  joyidAppURL:
    process.env.NODE_ENV === 'production'
      ? 'https://app.joy.id'
      : 'https://testnet.joyid.dev',
};
