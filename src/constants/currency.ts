import keyBy from 'lodash/keyBy';

export const CURRENCY_LIST = {
  empty: { symbol: '', decimals: 0, name: 'empty' },
  icx: { symbol: 'ICX', decimals: 3, name: 'ICON' },
  sicx: { symbol: 'sICX', decimals: 3, name: 'Staked ICX' },
  bnusd: { symbol: 'bnUSD', decimals: 3, name: 'ICON Dollar' },
  baln: { symbol: 'BALN', decimals: 3, name: 'Balanced Token' },
};

export const CURRENCY = ['ICX', 'sICX', 'bnUSD', 'BALN'];

export const CURRENCY_MAP = keyBy(CURRENCY);

export type CurrencyKey = string;

export const toMarketPair = (baseCurrencyKey: CurrencyKey, quoteCurrencyKey: string) =>
  `${baseCurrencyKey} / ${quoteCurrencyKey}`;

export interface Pair {
  baseCurrencyKey: CurrencyKey;
  quoteCurrencyKey: CurrencyKey;
  pair: string;
  id: string;
  poolId: number;
}

export const SUPPORTED_PAIRS: Array<Pair> = [
  {
    baseCurrencyKey: CURRENCY_MAP['sICX'],
    quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
    pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['bnUSD']),
    id: 'SICXbnUSD',
    poolId: 2,
  },
  {
    baseCurrencyKey: CURRENCY_MAP['BALN'],
    quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
    pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['bnUSD']),
    id: 'BALNbnUSD',
    poolId: 3,
  },
  {
    baseCurrencyKey: CURRENCY_MAP['ICX'],
    quoteCurrencyKey: CURRENCY_MAP['sICX'],
    pair: toMarketPair(CURRENCY_MAP['ICX'], CURRENCY_MAP['sICX']),
    id: 'SICXICX',
    poolId: 1,
  },
  {
    baseCurrencyKey: CURRENCY_MAP['sICX'],
    quoteCurrencyKey: CURRENCY_MAP['ICX'],
    pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['ICX']),
    id: 'SICXICX',
    poolId: 1,
  },
  {
    baseCurrencyKey: CURRENCY_MAP['bnUSD'],
    quoteCurrencyKey: CURRENCY_MAP['sICX'],
    pair: toMarketPair(CURRENCY_MAP['bnUSD'], CURRENCY_MAP['sICX']),
    id: '',
    poolId: 2,
  },
  {
    baseCurrencyKey: CURRENCY_MAP['bnUSD'],
    quoteCurrencyKey: CURRENCY_MAP['BALN'],
    pair: toMarketPair(CURRENCY_MAP['bnUSD'], CURRENCY_MAP['BALN']),
    id: '',
    poolId: 3,
  },
];

export const BASE_SUPPORTED_PAIRS = [SUPPORTED_PAIRS[0], SUPPORTED_PAIRS[1], SUPPORTED_PAIRS[2]];

export const getFilteredCurrencies = (baseCurrencyKey: CurrencyKey): CurrencyKey[] => {
  return SUPPORTED_PAIRS.filter(pair => pair.baseCurrencyKey === baseCurrencyKey).map(pair => pair.quoteCurrencyKey);
};

export const SUPPORTED_BASE_CURRENCIES = Array.from(new Set(SUPPORTED_PAIRS.map(pair => pair.baseCurrencyKey)));
