import { XChainType } from '@balancednetwork/sdk-core';

export type XAccount = {
  address: string | undefined;
  xChainType: XChainType | undefined;
};

export type XConnection = {
  xAccount: XAccount;
  xConnectorId: string;
};

export type CurrencyKey = string;

export * from './xChain';

export * from './xToken';
