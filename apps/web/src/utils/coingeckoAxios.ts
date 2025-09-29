import axios, { AxiosResponse, AxiosError } from 'axios';

// Global variable to store the current swap context for analytics tracking
let currentSwapContext: { from: string; to: string } | null = null;

// Create axios instance for CoinGecko API
const createCoinGeckoAxiosInstance = () => {
  const instance = axios.create();

  // Response interceptor to handle rate limit errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // Check if this is a CoinGecko API rate limit error
      if (isCoinGeckoRateLimitError(error)) {
        // Track the rate limit event
        trackCoinGeckoRateLimitError(error);
      }

      // Re-throw the error so it can be handled normally
      throw error;
    },
  );

  return instance;
};

// Check if the error is a CoinGecko rate limit error
const isCoinGeckoRateLimitError = (error: AxiosError): boolean => {
  if (!error.response) return false;

  const response = error.response;

  // CoinGecko rate limit errors typically return HTTP 429 (Too Many Requests)
  if (response.status === 429) {
    // Check if it's coming from CoinGecko API
    const url = error.config?.url || '';
    return url.includes('api.coingecko.com');
  }

  // Some CoinGecko endpoints might return different error codes for rate limiting
  // Check for CoinGecko-specific error messages
  if (response.status >= 400 && response.status < 500) {
    const url = error.config?.url || '';
    if (url.includes('api.coingecko.com')) {
      const errorMessage = (response.data as any)?.error || '';
      return (
        errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many requests')
      );
    }
  }

  return false;
};

// Function to set swap context for analytics tracking
export const setSwapContext = (context: { from: string; to: string } | null) => {
  currentSwapContext = context;
};

// Track CoinGecko rate limit errors with analytics
const trackCoinGeckoRateLimitError = (error: AxiosError) => {
  try {
    // Use current swap context or fallback to URL extraction
    let fromToken = 'unknown';
    let toToken = 'unknown';

    if (currentSwapContext) {
      fromToken = currentSwapContext.from;
      toToken = currentSwapContext.to;
    } else {
      // Fallback to URL extraction
      const url = error.config?.url || '';
      fromToken = extractFromTokenFromUrl(url);
      toToken = extractToTokenFromUrl(url);
    }

    // Dispatch custom event that components can listen to
    const event = new CustomEvent('coingeckoRateLimitHit', {
      detail: { from: fromToken, to: toToken },
    });
    window.dispatchEvent(event);
  } catch (err) {
    console.warn('Failed to track CoinGecko rate limit error:', err);
  }
};

// Extract token symbols from CoinGecko API URL parameters
const extractFromTokenFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const ids = params.get('ids');

    if (ids) {
      const coinIds = ids.split(',');
      // Map CoinGecko coin IDs back to token symbols
      return mapCoinGeckoIdToSymbol(coinIds[0]);
    }
  } catch (err) {
    console.warn('Failed to extract from token from URL:', err);
  }
  return 'unknown';
};

const extractToTokenFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    // For swap context, typically the second token is the output
    const ids = params.get('ids');
    if (ids) {
      const coinIds = ids.split(',');
      if (coinIds.length > 1) {
        return mapCoinGeckoIdToSymbol(coinIds[1]);
      }
    }

    // For USD pairs, return 'USD'
    const vsCurrency = params.get('vs_currency') || params.get('vs_currencies');
    if (vsCurrency?.toLowerCase() === 'usd') {
      return 'USD';
    }
  } catch (err) {
    console.warn('Failed to extract to token from URL:', err);
  }
  return 'USD';
};

// Map CoinGecko coin IDs back to token symbols
const mapCoinGeckoIdToSymbol = (coinId: string): string => {
  const symbolMap: Record<string, string> = {
    icon: 'ICX',
    'balanced-dao': 'BALN',
    'balanced-dollars': 'bnUSD',
    bitcoin: 'BTC',
    ethereum: 'ETH',
    'usd-coin': 'USDC',
    tether: 'USDT',
    binancecoin: 'BNB',
    'polygon-ecosystem-token': 'POL',
    'avalanche-2': 'AVAX',
    'injective-protocol': 'INJ',
    sui: 'SUI',
    stellar: 'XLM',
    tbtc: 'tBTC',
    weth: 'WETH',
    solana: 'SOL',
  };

  return symbolMap[coinId] || coinId.toUpperCase();
};

export const coinGeckoAxios = createCoinGeckoAxiosInstance();
