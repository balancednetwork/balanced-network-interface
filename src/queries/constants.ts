export const API_ENDPOINT =
  process.env.NODE_ENV === 'production'
    ? 'https://balanced.mainnet.sng.vultr.icon.community/api/v1'
    : 'https://balanced.mainnet.sng.vultr.icon.community/api/v1';
