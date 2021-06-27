import axios from 'axios';

import { API_V1_ENDPOINT } from './constants';

export type TotalTransactions = {
  total_transactions: number;
  loans_transactions: number;
  dividends_transactions: number;
  daofund_transactions: number;
  rewards_transactions: number;
  dex_transactions: number;
  governance_transactions: number;
  bnusd_transactions: number;
  balanced_token_transactions: number;
  sicx_transactions: number;
};
export const getTotalTransactions = async (): Promise<TotalTransactions> => {
  return await axios.get(`${API_V1_ENDPOINT}/stats/total-transactions`).then(res => res.data);
};
