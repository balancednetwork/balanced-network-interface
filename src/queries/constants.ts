export const API_ENDPOINT =
  process.env.NODE_ENV === 'production'
    ? 'https://balanced.sudoblock.io/api/v1'
    : 'https://balanced.sudoblock.io/api/v1';
