import { XChainType } from './xChain';

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

// declare WalletId enum
export enum WalletId {
  METAMASK = 'metamask',
  HANA = 'hana',
  PHANTOM = 'phantom',
  SUI = 'sui',
  KEPLR = 'keplr',
  HAVAH = 'havah',
}
