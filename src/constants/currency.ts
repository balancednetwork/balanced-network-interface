import keyBy from 'lodash/keyBy';

export const CURRENCYLIST = {
  icx: { symbol: 'ICX', decimals: 10, name: 'ICON' },
  sicx: { symbol: 'sICX', decimals: 10, name: 'Staked ICX' },
  bnusd: { symbol: 'bnUSD', decimals: 10, name: 'ICON Dollar' },
  baln: { symbol: 'BALN', decimals: 10, name: 'Blanced Token' },
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
}

export const SupportedPairs: Array<Pair> = [
  {
    baseCurrencyKey: CURRENCY_MAP['ICX'],
    quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
    pair: toMarketPair(CURRENCY_MAP['ICX'], CURRENCY_MAP['bnUSD']),
  },
  {
    baseCurrencyKey: CURRENCY_MAP['BALN'],
    quoteCurrencyKey: CURRENCY_MAP['bnUSD'],
    pair: toMarketPair(CURRENCY_MAP['BALN'], CURRENCY_MAP['bnUSD']),
  },
  {
    baseCurrencyKey: CURRENCY_MAP['sICX'],
    quoteCurrencyKey: CURRENCY_MAP['ICX'],
    pair: toMarketPair(CURRENCY_MAP['sICX'], CURRENCY_MAP['ICX']),
  },
];
