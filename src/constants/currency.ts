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

// export const CURRENCY_MAP = keyBy(CURRENCY);

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
    bnUSD: pairGernerator('sICX', 'bnUSD', 2),
    ICX: pairGernerator('sICX', 'ICX', 1),
  },
  BALN: {
    bnUSD: pairGernerator('BALN', 'bnUSD', 3),
    sICX: pairGernerator('BALN', 'sICX', 3),
  },
  ICX: {
    sICX: pairGernerator('ICX', 'sICX', 1),
  },
  bnUSD: {
    sICX: pairGernerator('bnUSD', 'sICX', 2),
    BALN: pairGernerator('sICX', 'BALN', 3),
  },
};

export const BASE_SUPPORTED_PAIRS = [
  SUPPORTED_PAIRS['sICX']['bnUSD'],
  SUPPORTED_PAIRS['BALN']['bnUSD'],
  SUPPORTED_PAIRS['sICX']['ICX'],
];

// export const getFilteredCurrencies = (baseCurrencyKey: CurrencyKey): CurrencyKey[] => {
//   return SUPPORTED_PAIRS.filter(pair => pair.baseCurrencyKey === baseCurrencyKey).map(pair => pair.quoteCurrencyKey);
// };

// export const SUPPORTED_BASE_CURRENCIES = Array.from(new Set(SUPPORTED_PAIRS.map(pair => pair.baseCurrencyKey)));
