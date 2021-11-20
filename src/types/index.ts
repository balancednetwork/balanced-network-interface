import BigNumber from 'bignumber.js';

import { RootState } from './RootState';

export type { RootState };

export type CurrencyKey = string;

export interface Pool {
  baseCurrencyKey: string;
  quoteCurrencyKey: string;
  base: BigNumber;
  quote: BigNumber;
  baseDeposited: BigNumber;
  quoteDeposited: BigNumber;
  total: BigNumber;
  rewards: BigNumber;
  rate: BigNumber;
  inverseRate: BigNumber;
}

export interface ProposalInterface {
  id: number;
  name: string;
  proposer: string;
  description: string;
  majority: number;
  snapshotDay: number;
  startDay: number;
  endDay: number;
  quorum: number;
  for: number;
  against: number;
  uniqueApproveVoters: number;
  uniqueRejectVoters: number;
  status: string;
  sum: number;
  voters: number;
  actions: string;
}
