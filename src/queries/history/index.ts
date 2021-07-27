import axios from 'axios';
import querystring from 'querystring';
import { useQuery } from 'react-query';

import { API_ENDPOINT } from '../constants';

export type Transaction = {
  block_hash: string;
  block_number: number;
  block_timestamp: number;
  indexed: string[];
  item_id: string;
  method: string;
  data: any;
  transaction_hash: string;
  address?: string;
  item_timestamp: string;
  [key: string]: any;
};

export const useAllTransactionsQuery = (page: number, limit: number, account: string | null | undefined) => {
  return useQuery<{ count: number; transactions: Transaction[] }>(
    ['transactions', page, limit, account],
    async () => {
      const endpoint = `${API_ENDPOINT}/stats/transaction-history?${querystring.stringify({
        skip: page * limit,
        limit: 20,
        from_address: account,
      })}`;

      const { data } = await axios.get(endpoint);
      return data;
    },
    {
      enabled: !!account,
    },
  );
};
