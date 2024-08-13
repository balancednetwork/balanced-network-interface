export type OpenInterest = {
  [name: string]: {
    [subName: string]: {
      value: number;
      totalSupply: number;
      isShort: boolean;
      shortSupply: number | null;
    };
  };
};

export type SynthTotalSupply = {
  name: string;
  totalSupply?: number;
  value: number;
};

export type SNXPriceData = {
  id: string;
  averagePrice: number;
};

export type ActiveStakersData = {
  id: string;
  count: number;
};

export type TradesRequestData = {
  id: string;
  trades: number;
  exchangers: number;
  exchangeUSDTally: number;
};

export type AreaChartData = {
  created: string;
  value: number;
};

export type TreeMapData = {
  value: number;
  name: string;
};

export type ChartPeriod = 'D' | 'W' | 'M' | 'Y';

export type TimeSeries = '1d' | '15m';

export type FeePeriod = {
  feesToDistribute: number;
  feesClaimed: number;
  rewardsToDistribute: number;
  rewardsClaimed: number;
  startTime: number;
};

export type OptionsMarket = {
  strikePrice: number;
  maturityDate: number;
  currencyKey: string;
  poolSize: string;
  expiryDate?: string;
  value?: number;
};
