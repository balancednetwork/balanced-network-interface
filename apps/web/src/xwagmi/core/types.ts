import { XChainType } from '@/types';
import { XConnector } from './XConnector';

export type XAccount = {
  address: string | undefined;
  xChainType: XChainType | undefined;
};

export type XConnection = {
  xAccount: XAccount;
  xConnector: XConnector;
};
