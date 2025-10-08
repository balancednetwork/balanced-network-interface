// CoinGecko API Configuration
export const COINGECKO_API_BASE_URL = '/api/coingecko';

// Supported Cryptocurrency IDs for CoinGecko API
// Only includes tokens with chainId: 1 from tokenlist.json with verified CoinGecko IDs
export const COINGECKO_COIN_IDS = {
  ICX: 'icon',
  // sICX: 'staked-icon', // Not confirmed on CoinGecko
  bnUSD: 'balanced-dollars',
  'bnUSD(old)': 'balanced-dollars',
  BALN: 'balanced-dao',
  // OMM: '', // Not confirmed on CoinGecko
  // CFT: '', // Not confirmed on CoinGecko
  // BTCB: '', // Not confirmed on CoinGecko
  BTC: 'bitcoin',
  BTCB: 'bitcoin',
  WBTC: 'wrapped-bitcoin',
  ETH: 'ethereum',
  // sARCH: '', // Not confirmed on CoinGecko
  USDC: 'usd-coin',
  USDT: 'tether',
  BNB: 'binancecoin',
  POL: 'polygon-ecosystem-token',
  AVAX: 'avalanche-2',
  INJ: 'injective-protocol',
  // HVH: '', // Not confirmed on CoinGecko
  // hyTB: '', // Not confirmed on CoinGecko
  SUI: 'sui',
  XLM: 'stellar',
  tBTC: 'tbtc',
  wstETH: 'wrapped-steth',
  weETH: 'wrapped-eeth',
  WETH: 'weth',
  SOL: 'solana',
  // JitoSOL: 'jito-staked-sol', // Need to verify
  // SODA: '', // Not confirmed on CoinGecko
  // cbBTC: 'coinbase-wrapped-btc', // Need to verify
  vSUI: 'volo-staked-sui',
  haSUI: 'haedal-staked-sui',
  afSUI: 'aftermath-staked-sui',
  // mSUI: '', // Not confirmed on CoinGecko
  // S: 'sonic', // Sonic Labs blockchain (formerly Fantom) native token - Chain ID 146
} as const;

// Chart time periods supported by CoinGecko
export const COINGECKO_CHART_PERIODS = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '1y': 365,
  max: 'max',
} as const;

// OHLC candle periods for CoinGecko Pro API
export const COINGECKO_OHLC_PERIODS = {
  '7d': 'hourly', // Week: fetch hourly, aggregate to 2h
  '30d': 'hourly', // Month: fetch hourly, aggregate to 8h
  '180d': 'daily', // 6 months: fetch daily, aggregate to 2d
} as const;

// Aggregation settings for custom candle periods
export const COINGECKO_OHLC_AGGREGATION = {
  '7d': 2, // Week: aggregate 2 hourly candles to make 2h candles
  '30d': 8, // Month: aggregate 8 hourly candles to make 8h candles
  '180d': 2, // 6 months: aggregate 2 daily candles to make 2d candles
} as const;

// Note: market_chart endpoint doesn't support interval parameter
// Granularity is automatically determined by the days parameter:
// - 1-7 days: hourly data
// - 8-90 days: daily data
// - 90+ days: daily data

// Currency codes supported by CoinGecko
export const COINGECKO_CURRENCIES = {
  USD: 'usd',
  BTC: 'btc',
  ETH: 'eth',
} as const;

export type CoinGeckoCoinId = keyof typeof COINGECKO_COIN_IDS;
export type CoinGeckoChartPeriod = keyof typeof COINGECKO_CHART_PERIODS;
export type CoinGeckoOHLCPeriod = keyof typeof COINGECKO_OHLC_PERIODS;
export type CoinGeckoOHLCAggregation = keyof typeof COINGECKO_OHLC_AGGREGATION;
export type CoinGeckoCurrency = keyof typeof COINGECKO_CURRENCIES;
