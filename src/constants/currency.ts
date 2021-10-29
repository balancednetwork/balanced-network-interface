import keyBy from 'lodash/keyBy';
import { SupportedChainId as NetworkId } from 'packages/BalancedJs';

import { ReactComponent as BALNIcon } from 'assets/tokens/BALN.svg';
import { ReactComponent as bnUSDIcon } from 'assets/tokens/bnUSD.svg';
import { ReactComponent as CFTIcon } from 'assets/tokens/CFT.svg';
import { ReactComponent as ICXIcon } from 'assets/tokens/ICX.svg';
import { ReactComponent as IUSDCIcon } from 'assets/tokens/IUSDC.svg';
import { ReactComponent as IUSDTIcon } from 'assets/tokens/IUSDT.svg';
import { ReactComponent as METXIcon } from 'assets/tokens/METX.svg';
import { ReactComponent as OMMIcon } from 'assets/tokens/OMM.svg';
import { ReactComponent as sICXIcon } from 'assets/tokens/sICX.svg';
import { ReactComponent as USDSIcon } from 'assets/tokens/USDS.svg';
import { CurrencyKey, Pool } from 'types';

export const CURRENCY_INFO: { [networkId: number]: CurrencyKey[] } = {
  [NetworkId.MAINNET]: ['ICX', 'sICX', 'bnUSD', 'BALN', 'IUSDC', 'OMM', 'USDS', 'CFT', 'METX', 'IUSDT'],
  [NetworkId.YEOUIDO]: ['ICX', 'sICX', 'bnUSD', 'BALN', 'OMM', 'IUSDC', 'USDS', 'CFT'],
  [NetworkId.SEJONG]: ['ICX', 'sICX', 'bnUSD', 'BALN', 'OMM', 'USDS', 'IUSDC'],
};

const NETWORK_ID: NetworkId = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export const CURRENCY: CurrencyKey[] = CURRENCY_INFO[NETWORK_ID];

export const CURRENCY_MAP = keyBy(CURRENCY);

export const currencyKeyToIconMap = {
  ICX: ICXIcon,
  sICX: sICXIcon,
  bnUSD: bnUSDIcon,
  BALN: BALNIcon,
  OMM: OMMIcon,
  IUSDC: IUSDCIcon,
  USDS: USDSIcon,
  CFT: CFTIcon,
  METX: METXIcon,
  IUSDT: IUSDTIcon,
};

export const toMarketPair = (baseCurrencyKey: CurrencyKey, quoteCurrencyKey: string) =>
  `${baseCurrencyKey} / ${quoteCurrencyKey}`;

export interface Pair {
  baseCurrencyKey: CurrencyKey;
  quoteCurrencyKey: CurrencyKey;
  pair: string;
  poolId: number;
  rewards?: number;
}

export const SUPPORTED_PAIRS_INFO: { [networkId: number]: Pair[] } = {
  [NetworkId.MAINNET]: [
    {
      baseCurrencyKey: CURRENCY_MAP['sICX'],
      quoteCurrencyKey: CURRENCY_MAP['ICX'],
      pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['ICX']),
      poolId: 1,
      rewards: 0.05,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['sICX'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['bnUSD']),
      poolId: 2,
      rewards: 0.145,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['BALN'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['bnUSD']),
      poolId: 3,
      rewards: 0.145,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['BALN'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['sICX']),
      poolId: 4,
      rewards: 0.1,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['IUSDC'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['IUSDC'], CURRENCY_MAP['bnUSD']),
      poolId: 5,
      rewards: 0.015,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['IUSDT'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['IUSDT'], CURRENCY_MAP['bnUSD']),
      poolId: 15,
      rewards: 0.03,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['USDS'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['USDS'], CURRENCY_MAP['bnUSD']),
      poolId: 10,
      rewards: 0.005,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['sICX']),
      poolId: 7,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['IUSDC'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['IUSDC']),
      poolId: 6,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['USDS'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['USDS']),
      poolId: 8,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['CFT'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['CFT'], CURRENCY_MAP['sICX']),
      poolId: 9,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['METX'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['METX'], CURRENCY_MAP['bnUSD']),
      poolId: 11,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['METX'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['METX'], CURRENCY_MAP['sICX']),
      poolId: 12,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['METX'],
      quoteCurrencyKey: CURRENCY_MAP['IUSDC'],
      pair: toMarketPair(CURRENCY_MAP['METX'], CURRENCY_MAP['IUSDC']),
      poolId: 13,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['METX'],
      quoteCurrencyKey: CURRENCY_MAP['USDS'],
      pair: toMarketPair(CURRENCY_MAP['METX'], CURRENCY_MAP['USDS']),
      poolId: 14,
    },
  ],

  [NetworkId.YEOUIDO]: [
    {
      baseCurrencyKey: CURRENCY_MAP['sICX'],
      quoteCurrencyKey: CURRENCY_MAP['ICX'],
      pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['ICX']),
      poolId: 1,
      rewards: 0.1,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['sICX'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['bnUSD']),
      poolId: 2,
      rewards: 0.175,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['BALN'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['bnUSD']),
      poolId: 3,
      rewards: 0.175,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['BALN'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['sICX']),
      poolId: 4,
      rewards: 0.05,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['IUSDC'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['IUSDC']),
      poolId: 22,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['sICX']),
      poolId: 20,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['USDS'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['USDS']),
      poolId: 21,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['CFT'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['CFT'], CURRENCY_MAP['sICX']),
      poolId: 30,
    },
  ],

  [NetworkId.SEJONG]: [
    {
      baseCurrencyKey: CURRENCY_MAP['sICX'],
      quoteCurrencyKey: CURRENCY_MAP['ICX'],
      pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['ICX']),
      poolId: 1,
      rewards: 0.1,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['sICX'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['bnUSD']),
      poolId: 2,
      rewards: 0.175,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['BALN'],
      quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
      pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['bnUSD']),
      poolId: 3,
      rewards: 0.175,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['sICX'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['sICX']),
      poolId: 4,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['USDS'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['USDS']),
      poolId: 5,
    },
    {
      baseCurrencyKey: CURRENCY_MAP['OMM'],
      quoteCurrencyKey: CURRENCY_MAP['IUSDC'],
      pair: toMarketPair(CURRENCY_MAP['OMM'], CURRENCY_MAP['IUSDC']),
      poolId: 6,
    },
  ],
};

export const SUPPORTED_PAIRS: Array<Pair> = SUPPORTED_PAIRS_INFO[NETWORK_ID];

export const getPairableCurrencies = (currencyKey: CurrencyKey | undefined): CurrencyKey[] => {
  if (!currencyKey) return CURRENCY;

  const leftPairableCurrencies = SUPPORTED_PAIRS.filter(pair => pair.quoteCurrencyKey === currencyKey).map(
    pair => pair.baseCurrencyKey,
  );

  const rightPairableCurrencies = SUPPORTED_PAIRS.filter(pair => pair.baseCurrencyKey === currencyKey).map(
    pair => pair.quoteCurrencyKey,
  );

  return [...leftPairableCurrencies, ...rightPairableCurrencies];
};

export const getTradePair = (baseKey: CurrencyKey, quoteKey: CurrencyKey): [Pair | undefined, boolean | undefined] => {
  const pair1 = SUPPORTED_PAIRS.find(pair => pair.baseCurrencyKey === baseKey && pair.quoteCurrencyKey === quoteKey);
  const pair2 = SUPPORTED_PAIRS.find(pair => pair.baseCurrencyKey === quoteKey && pair.quoteCurrencyKey === baseKey);

  if (pair1) {
    return [pair1, false];
  } else if (pair2) {
    return [pair2, true];
  }
  return [undefined, undefined];
};

export const isQueue = (t: Pool | Pair) => {
  if (
    (t.baseCurrencyKey === 'sICX' && t.quoteCurrencyKey === 'ICX') ||
    (t.baseCurrencyKey === 'ICX' && t.quoteCurrencyKey === 'sICX')
  )
    return true;
  return false;
};

export const addressToCurrencyKeyMap = {
  [NetworkId.MAINNET]: {
    cx2609b924e33ef00b648a409245c7ea394c467824: 'sICX',
    cx88fd7df7ddff82f7cc735c871dc519838cb235bb: 'bnUSD',
    cxf61cd5a45dc9f91c15aa65831a30a90d59a09619: 'BALN',
    cx0000000000000000000000000000000000000000: 'ICX',
    cxae3034235540b924dfcc1b45836c293dcc82bfb7: 'IUSDC',
    cxbb2871f468a3008f80b08fdde5b8b951583acf06: 'USDS',
    cx1a29259a59f463a67bb2ef84398b30ca56b5830a: 'OMM',
    cx2e6d0fc0eca04965d06038c8406093337f085fcf: 'CFT',
    cx369a5f4ce4f4648dfc96ba0c8229be0693b4eca2: 'METX',
    cx3a36ea1f6b9aa3d2dd9cb68e8987bcc3aabaaa88: 'IUSDT',
  },
  [NetworkId.YEOUIDO]: {
    cxae6334850f13dfd8b50f8544d5acb126bb8ef82d: 'sICX',
    cxc48c9c81ceef04445c961c5cc8ff056d733dfe3a: 'bnUSD',
    cx36169736b39f59bf19e8950f6c8fa4bfa18b710a: 'BALN',
    cx0000000000000000000000000000000000000000: 'ICX',
    cx65f639254090820361da483df233f6d0e69af9b7: 'IUSDC',
    cxc0666df567a6e0b49342648e98ccbe5362b264ea: 'USDS',
    cx05515d126a47a98c682fa86992329e6c2ec70503: 'OMM',
    cxf7313d7fd611c99b8db29e298699be4b1fd86661: 'CFT',
  },
  [NetworkId.SEJONG]: {
    cx0e706eca3552a6e607095319f4ad8cea37e779d4: 'sICX',
    cx041714d034919c8456d3606f8766f0169e35cb8e: 'bnUSD',
    cxb45058d398614a7c8cdf7be6f556fa0b39399799: 'BALN',
    cx0000000000000000000000000000000000000000: 'ICX',
  },
};
