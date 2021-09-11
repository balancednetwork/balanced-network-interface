export const API_ENDPOINT =
  process.env.NODE_ENV === 'production'
    ? 'https://a.balanced.geometry.io/api/v1'
    : 'https://balanced.geometry.io/api/v1';
