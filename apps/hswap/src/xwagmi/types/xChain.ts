import { XChainId, XChainType } from '@balancednetwork/sdk-core';

export type Chain = {
  id: string | number;
  name: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  rpc: {
    http: string;
    ws?: string;
  };
  tracker: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: XChainId;
  xChainType: XChainType;
  contracts: {
    xCall: string;
    assetManager: string;
    bnUSD?: string;
    liquidSwap?: string;
  };
  autoExecution: boolean;
  gasThreshold: number;
};
