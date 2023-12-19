export const joyIdConfig = {
  name: 'flycat',
  logo: 'https://flycat.club/logo512.png',
  joyidAppURL:
    process.env.NODE_ENV === 'production'
      ? 'https://app.joy.id'
      : 'https://testnet.joyid.dev',
};
