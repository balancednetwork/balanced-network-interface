import { XChainId, XChainType } from '@balancednetwork/sdk-core';
export type { XChainId, XChainType } from '@balancednetwork/sdk-core';

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
  tracker: {
    tx: string;
  };
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
    xCallManager?: string;
    bnUSDToken?: string;
  };
  autoExecution: boolean;
  gasThreshold: number;
  useXCallScanner: boolean;
};
