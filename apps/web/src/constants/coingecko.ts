// CoinGecko API Configuration
export const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
export const COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

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
  tBTC: 'tbtc', // Need to verify
  // wstETH: 'wrapped-steth', // Need to verify
  // weETH: '', // Not confirmed on CoinGecko
  WETH: 'weth',
  SOL: 'solana',
  // JitoSOL: 'jito-staked-sol', // Need to verify
  // SODA: '', // Not confirmed on CoinGecko
  // cbBTC: 'coinbase-wrapped-btc', // Need to verify
  // vSUI: '', // Not confirmed on CoinGecko
  // haSUI: '', // Not confirmed on CoinGecko
  // afSUI: '', // Not confirmed on CoinGecko
  // mSUI: '', // Not confirmed on CoinGecko
  // S: '', // Not confirmed on CoinGecko
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

// Currency codes supported by CoinGecko
export const COINGECKO_CURRENCIES = {
  USD: 'usd',
  BTC: 'btc',
  ETH: 'eth',
} as const;

export type CoinGeckoCoinId = keyof typeof COINGECKO_COIN_IDS;
export type CoinGeckoChartPeriod = keyof typeof COINGECKO_CHART_PERIODS;
export type CoinGeckoCurrency = keyof typeof COINGECKO_CURRENCIES;
