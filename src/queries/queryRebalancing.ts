import axios from 'axios';
import { stringify } from 'querystring';

import { API_ENDPOINT_V1 } from './constants';

const endpoint = `${API_ENDPOINT_V1}/stats/rebalanced`;

export const queryRebalanced = async ({ address, symbol = 'bnUSD', timestamp }) => {
  const params = {
    address,
    token_symbol: symbol,
    from_timestamp: timestamp,
  };
  return axios.get(`${endpoint}?${stringify(params)}`);
};
