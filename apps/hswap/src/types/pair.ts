import { Token } from '@balancednetwork/sdk-core';

export interface PairInfo {
  readonly chainId: number;
  readonly id: number;
  readonly name: string;
  readonly baseCurrencyKey: string;
  readonly quoteCurrencyKey: string;
  readonly rewards?: number;
  readonly baseToken: Token;
  readonly quoteToken: Token;
}
