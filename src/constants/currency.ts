import keyBy from 'lodash/keyBy';
import { BalancedJs } from 'packages/BalancedJs';

import { ReactComponent as BALNIcon } from 'assets/tokens/BALN.svg';
import { ReactComponent as bnUSDIcon } from 'assets/tokens/bnUSD.svg';
import { ReactComponent as ICXIcon } from 'assets/tokens/ICX.svg';
import { ReactComponent as sICXIcon } from 'assets/tokens/sICX.svg';

export type CurrencyType = {
  symbol: CurrencyKey;
  decimals: number;
  name: string;
};

export const CURRENCY_LIST: {
  [key: string]: CurrencyType;
} = {
  empty: { symbol: '', decimals: 0, name: 'empty' },
  icx: { symbol: 'ICX', decimals: 3, name: 'ICON' },
  sicx: { symbol: 'sICX', decimals: 3, name: 'Staked ICX' },
  bnusd: { symbol: 'bnUSD', decimals: 3, name: 'ICON Dollar' },
  baln: { symbol: 'BALN', decimals: 3, name: 'Balanced Token' },
};

export const CURRENCY = ['ICX', 'sICX', 'bnUSD', 'BALN'];

export const CURRENCY_MAP = keyBy(CURRENCY);

export const currencyKeyToIconMap = {
  [CURRENCY_MAP.ICX]: ICXIcon,
  [CURRENCY_MAP.sICX]: sICXIcon,
  [CURRENCY_MAP.bnUSD]: bnUSDIcon,
  [CURRENCY_MAP.BALN]: BALNIcon,
};

export type CurrencyKey = string;

export const toMarketPair = (baseCurrencyKey: CurrencyKey, quoteCurrencyKey: string) =>
  `${baseCurrencyKey} / ${quoteCurrencyKey}`;

export interface Pair {
  baseCurrencyKey: CurrencyKey;
  quoteCurrencyKey: CurrencyKey;
  pair: string;
  poolId: number;
}

// export const SUPPORTED_PAIRS: Array<Pair> = [
//   {
//     baseCurrencyKey: CURRENCY_MAP['sICX'],
//     quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
//     pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['bnUSD']),
//     poolId: 2,
//   },
//   {
//     baseCurrencyKey: CURRENCY_MAP['BALN'],
//     quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
//     pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['bnUSD']),
//     poolId: 3,
//   },
//   {
//     baseCurrencyKey: CURRENCY_MAP['sICX'],
//     quoteCurrencyKey: CURRENCY_MAP['ICX'],
//     pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['ICX']),
//     poolId: 1,
//   },
//   {
//     baseCurrencyKey: CURRENCY_MAP['ICX'],
//     quoteCurrencyKey: CURRENCY_MAP['sICX'],
//     pair: toMarketPair(CURRENCY_MAP['ICX'], CURRENCY_MAP['sICX']),
//     poolId: 1,
//   },
//   {
//     baseCurrencyKey: CURRENCY_MAP['bnUSD'],
//     quoteCurrencyKey: CURRENCY_MAP['sICX'],
//     pair: toMarketPair(CURRENCY_MAP['bnUSD'], CURRENCY_MAP['sICX']),
//     poolId: 2,
//   },
//   {
//     baseCurrencyKey: CURRENCY_MAP['bnUSD'],
//     quoteCurrencyKey: CURRENCY_MAP['BALN'],
//     pair: toMarketPair(CURRENCY_MAP['bnUSD'], CURRENCY_MAP['BALN']),
//     poolId: 3,
//   },
// ];

export type JUAN_CurrencyKey = 'ICX' | 'sICX' | 'bnUSD' | 'BALN';

const pairGernerator = (base: JUAN_CurrencyKey, quote: JUAN_CurrencyKey, poolId: number): Pair => ({
  baseCurrencyKey: base,
  quoteCurrencyKey: quote,
  pair: toMarketPair(base, quote),
  poolId,
});

export const SUPPORTED_PAIRS = {
  sICX: {
    bnUSD: pairGernerator('sICX', 'bnUSD', BalancedJs.utils.POOL_IDS.sICXbnUSD),
    ICX: pairGernerator('sICX', 'ICX', BalancedJs.utils.POOL_IDS.sICXICX),
    BALN: pairGernerator('sICX', 'BALN', BalancedJs.utils.POOL_IDS.BALNsICX),
  },
  BALN: {
    bnUSD: pairGernerator('BALN', 'bnUSD', BalancedJs.utils.POOL_IDS.BALNbnUSD),
    sICX: pairGernerator('BALN', 'sICX', BalancedJs.utils.POOL_IDS.BALNsICX),
  },
  ICX: {
    sICX: pairGernerator('ICX', 'sICX', BalancedJs.utils.POOL_IDS.sICXICX),
  },
  bnUSD: {
    sICX: pairGernerator('bnUSD', 'sICX', BalancedJs.utils.POOL_IDS.sICXbnUSD),
    BALN: pairGernerator('bnUSD', 'BALN', BalancedJs.utils.POOL_IDS.BALNbnUSD),
  },
};

export const BASE_SUPPORTED_PAIRS = [
  SUPPORTED_PAIRS['sICX']['bnUSD'],
  SUPPORTED_PAIRS['BALN']['bnUSD'],
  SUPPORTED_PAIRS['BALN']['sICX'],
  SUPPORTED_PAIRS['ICX']['sICX'],
];

// export const getFilteredCurrencies = (baseCurrencyKey: CurrencyKey): CurrencyKey[] => {
//   return SUPPORTED_PAIRS.filter(pair => pair.baseCurrencyKey === baseCurrencyKey).map(pair => pair.quoteCurrencyKey);
// };

// export const SUPPORTED_BASE_CURRENCIES = Array.from(new Set(SUPPORTED_PAIRS.map(pair => pair.baseCurrencyKey)));
