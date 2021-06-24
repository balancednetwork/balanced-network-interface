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
  data: string[];
  transaction_hash: string;
  address?: string;
  item_timestamp: string;
};

export const getAllTransactions = async (
  params: { skip: number; limit: number; [key: string]: any } = {
    skip: 0,
    limit: 10,
  },
): Promise<{ count: number; transactions: Transaction[] }> => {
  const endpoint = `${API_V1_ENDPOINT}/stats/transaction-history?${querystring.stringify(params)}`;

  return axios(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.data);
};
