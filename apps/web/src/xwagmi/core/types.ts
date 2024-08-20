import { XChainType } from '@/types';
import { XConnector } from './XConnector';

export type XAccount = {
  address: string | undefined;
  xChainType: XChainType;
};

export type XConnection = {
  xAccount: XAccount;
  xConnector: XConnector;
};
