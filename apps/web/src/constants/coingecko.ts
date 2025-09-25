// CoinGecko API Configuration
export const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
export const COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

// Supported Cryptocurrency IDs for CoinGecko API
export const COINGECKO_COIN_IDS = {
  SUI: 'sui',
  ETH: 'ethereum',
  SOL: 'solana',
  BTC: 'bitcoin',
  ICX: 'icon',
  BALN: 'balanced-dao',
  USDC: 'usd-coin',
  USDT: 'tether',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
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
