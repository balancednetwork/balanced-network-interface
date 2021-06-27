import axios from 'axios';
import querystring from 'querystring';

import { API_V1_ENDPOINT } from './constants';

export type Transaction = {
  block_hash: string;
  block_number: number;
  block_timestamp: number;
  data: {
    method: string;
    params: {
      _value: string;
      _symbol: string;
    };
  };
  item_id: string;
};

export const getLoanTransation = async (
  params: { skip: number; limit: number; [key: string]: any } = {
    skip: 0,
    limit: 10,
  },
): Promise<Transaction[]> => {
  params.min_block_number = -1;
  params.max_block_number = -1;

  const endpoint = `${API_V1_ENDPOINT}/loans/transactions?${querystring.stringify(params)}`;

  return axios(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.data);
};
