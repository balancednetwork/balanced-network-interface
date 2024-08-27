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

// export * from '../xwagmi/types/xChain';

export * from '../xwagmi/types/xToken';

export * from './pair';
