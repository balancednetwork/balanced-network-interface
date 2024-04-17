import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';

export type SourceName = string;

export type BribeToken = string;

export type Bribe = {
  sourceName: SourceName;
  bribeToken: BribeToken;
  activePeriod: number;
  claimable: CurrencyAmount<Token>;
  futureBribes: { timestamp: number; bribe: CurrencyAmount<Token> }[];
};
