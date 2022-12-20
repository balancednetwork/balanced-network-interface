import { serverEndpoint } from 'btp/src/connectors/constants';

export const fetchAPI = (endpoint, config = {}) => {
  const { baseURL, ...rest } = config;
  return fetch(`${baseURL || serverEndpoint}${endpoint}`, {
    ...rest,
    credentials: 'omit',
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.json();
    })
    .catch(error => {
      throw error;
    });
};
