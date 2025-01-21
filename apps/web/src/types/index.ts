import { TokenStats } from '@/queries/backendv2';
import { Currency } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { BigNumber } from 'icon-sdk-js';

export type CurrencyKey = string;
export interface ProposalInterface {
  id: number;
  name: string;
  proposer: string;
  description: string;
  majority: number;
  snapshotBlock: number;
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
  forumLink: string;
}

export type IcxDisplayType = 'ICX' | 'sICX';

export type InterestPeriod = { display: string; days: number };

export type WithdrawalFloorDataType = {
  floor: BigNumber;
  current: BigNumber;
  available: CurrencyAmount<Currency>;
  token: TokenStats;
};

export * from './pair';
