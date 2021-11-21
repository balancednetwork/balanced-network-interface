import { SupportedChainId as NetworkId } from 'packages/BalancedJs';

import { NETWORK_ID } from './config';

export interface PairInfo {
  readonly chainId: number;
  readonly id: number;
  readonly name: string;
  readonly baseCurrencyKey: string;
  readonly quoteCurrencyKey: string;
  readonly rewards?: number;
}

// this information contains the pairs the balanced supports
// eventually this information will saved in json file.

export const SUPPORTED_PAIRS_INFO: { [networkId: number]: PairInfo[] } = {
  [NetworkId.MAINNET]: [
    {
      chainId: 1,
      id: 1,
      name: 'sICX/ICX',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'ICX',
      rewards: 0.05,
    },
    {
      chainId: 1,
      id: 2,
      name: 'sICX/bnUSD',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.145,
    },
    {
      chainId: 1,
      id: 3,
      name: 'BALN/bnUSD',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.145,
    },
    {
      chainId: 1,
      id: 4,
      name: 'BALN/sICX',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'sICX',
      rewards: 0.1,
    },
    {
      chainId: 1,
      id: 5,
      name: 'IUSDC/bnUSD',
      baseCurrencyKey: 'IUSDC',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.015,
    },
    {
      chainId: 1,
      id: 15,
      name: 'IUSDT/bnUSD',
      baseCurrencyKey: 'IUSDT',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.03,
    },
    {
      chainId: 1,
      id: 10,
      name: 'USDS/bnUSD',
      baseCurrencyKey: 'USDS',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.005,
    },
    {
      chainId: 1,
      id: 7,
      name: 'OMM/sICX',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'sICX',
    },
    {
      chainId: 1,
      id: 6,
      name: 'OMM/IUSDC',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'IUSDC',
    },
    {
      chainId: 1,
      id: 8,
      name: 'OMM/USDS',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'USDS',
    },
    {
      chainId: 1,
      id: 9,
      name: 'CFT/sICX',
      baseCurrencyKey: 'CFT',
      quoteCurrencyKey: 'sICX',
    },
    {
      chainId: 1,
      id: 11,
      name: 'METX/bnUSD',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'bnUSD',
    },
    {
      chainId: 1,
      id: 12,
      name: 'METX/sICX',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'sICX',
    },
    {
      chainId: 1,
      id: 13,
      name: 'METX/IUSDC',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'IUSDC',
    },
    {
      chainId: 1,
      id: 14,
      name: 'METX/USDS',
      baseCurrencyKey: 'METX',
      quoteCurrencyKey: 'USDS',
    },
  ],
  [NetworkId.YEOUIDO]: [
    {
      chainId: 3,
      id: 1,
      name: 'sICX/ICX',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'ICX',
      rewards: 0.1,
    },
    {
      chainId: 3,
      id: 2,
      name: 'sICX/bnUSD',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.175,
    },
    {
      chainId: 3,
      id: 0,
      name: 'BALN/bnUSD',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.175,
    },
    {
      chainId: 3,
      //id: 4,
      id: 5,
      name: 'BALN/sICX',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'sICX',
      rewards: 0.05,
    },
    {
      chainId: 3,
      id: 24,
      name: 'OMM/IUSDC',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'IUSDC',
    },
    {
      chainId: 3,
      id: 4,
      // id: 25,
      name: 'OMM/sICX',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'sICX',
    },
    {
      chainId: 3,
      id: 23,
      name: 'OMM/USDS',
      baseCurrencyKey: 'OMM',
      quoteCurrencyKey: 'USDS',
    },
    {
      chainId: 3,
      id: 30,
      name: 'CFT/sICX',
      baseCurrencyKey: 'CFT',
      quoteCurrencyKey: 'sICX',
    },
  ],
  [NetworkId.SEJONG]: [
    {
      chainId: 83,
      id: 1,
      name: 'sICX/ICX',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'ICX',
      rewards: 0.07,
    },
    {
      chainId: 83,
      id: 2,
      name: 'sICX/bnUSD',
      baseCurrencyKey: 'sICX',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.175,
    },
    {
      chainId: 83,
      id: 3,
      name: 'BALN/bnUSD',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.175,
    },
    {
      chainId: 83,
      id: 4,
      name: 'BALN/sICX',
      baseCurrencyKey: 'BALN',
      quoteCurrencyKey: 'sICX',
      rewards: 0.05,
    },
    {
      chainId: 83,
      id: 5,
      name: 'IUSDC/bnUSD',
      baseCurrencyKey: 'IUSDC',
      quoteCurrencyKey: 'bnUSD',
      rewards: 0.005,
    },
  ],
};

export const SUPPORTED_PAIRS = SUPPORTED_PAIRS_INFO[NETWORK_ID];
