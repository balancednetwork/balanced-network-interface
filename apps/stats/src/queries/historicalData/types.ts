export type Granularity = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export type MethodParam = {
  isNumber: boolean;
  value: number | string;
};

export type Contract =
  | 'BALN'
  | 'sICX'
  | 'bnUSD'
  | 'Loans'
  | 'Router'
  | 'Band'
  | 'Staking'
  | 'Dex'
  | 'Rewards'
  | 'Dividends'
  | 'Governance'
  | 'Rebalancing'
  | 'DAOFund'
  | 'StabilityFund'
  | 'StakedLP'
  | 'BalancedOracle'
  | 'BBALN'
  | 'FeeHandler';

export type HistoryForParams = {
  contract?: Contract;
  contractAddress?: string;
  method: string;
  methodParams?: MethodParam[];
  granularity: Granularity;
  startTime: number;
  endTime?: number;
  transformation: (item: any, optional?: any) => any;
  uniqueID?: number;
};
