export type XChainId =
  | 'archway-1'
  | 'archway'
  | '0x1.icon'
  | '0x2.icon'
  | '0xa86a.avax'
  | '0xa869.fuji'
  | '0x100.icon'
  | '0x38.bsc'
  | '0xa4b1.arbitrum'
  | '0x2105.base';

export type XChainType = 'ICON' | 'EVM' | 'ARCHWAY' | 'HAVAH';

export enum XWalletType {
  ICON,
  COSMOS,
  EVM,
  EVM_ARBITRUM,
  EVM_AVALANCHE,
  EVM_BSC,
  EVM_BASE,
  HAVAH,
}

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
  xWalletType: XWalletType;
  contracts: {
    xCall: string;
    assetManager: string;
    bnUSD?: string;
    liquidSwap?: string;
  };
  autoExecution: boolean;
  gasThreshold: number;
};
