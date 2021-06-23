import axios from 'axios';
import querystring from 'querystring';

import { API_V1_ENDPOINT } from './constants';

export type Transaction = {
  block_hash: string;
  block_number: number;
  block_timestamp: number;
  indexed: string[];
  item_id: string;
  method: string;
};

export const getAllTransactions = async (
  params: { skip: number; limit: number; [key: string]: any } = {
    skip: 0,
    limit: 10,
  },
): Promise<Transaction[]> => {
  params.min_block_number = -1;
  params.max_block_number = -1;

  const endpoint = `${API_V1_ENDPOINT}/stats/transaction-history?${querystring.stringify(params)}`;

  return axios(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.data);
};
