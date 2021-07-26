export const API_ENDPOINT_V1 =
  process.env.NODE_ENV === 'production'
    ? 'https://balanced.geometry.io/api/v1'
    : 'https://b.balanced.geometry.io/api/v1';
