export const API_ENDPOINT =
  process.env.NODE_ENV === 'production'
    ? 'https://balanced.icon.community/api/v1'
    : 'https://balanced.icon.community/api/v1';
