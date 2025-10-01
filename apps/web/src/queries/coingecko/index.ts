import { coinGeckoAxios } from '@/utils/coingeckoAxios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { COINGECKO_API_BASE_URL, COINGECKO_CURRENCIES } from '@/constants/coingecko';
import { QUERY_KEYS } from '@/queries/queryKeys';
import {
  ChartDataPoint,
  CoinGeckoCoinDetails,
  CoinGeckoCoinInfo,
  CoinGeckoMarketChartData,
  CoinGeckoSimplePrice,
  ProcessedChartData,
} from '@/types/coingecko';

// Simple price query - get current prices for multiple coins
export const useCoinGeckoSimplePrice = (coinIds: string[], currencies: string[] = ['usd'], enabled: boolean = true) => {
  return useQuery<CoinGeckoSimplePrice>({
    queryKey: QUERY_KEYS.CoinGecko.SimplePrice(coinIds, currencies),
    queryFn: async () => {
      const { data } = await coinGeckoAxios.get<CoinGeckoSimplePrice>(`${COINGECKO_API_BASE_URL}/simple/price`, {
        params: {
          ids: coinIds.join(','),
          vs_currencies: currencies.join(','),
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true,
          include_last_updated_at: true,
        },
      });
      return data;
    },
    enabled: enabled && coinIds.length > 0,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
    placeholderData: keepPreviousData,
  });
};

// Market chart data for price charts
export const useCoinGeckoMarketChart = (
  coinId: string,
  currency: string = 'usd',
  days: number | string = 30,
  enabled: boolean = true,
) => {
  return useQuery<CoinGeckoMarketChartData>({
    queryKey: QUERY_KEYS.CoinGecko.MarketChart(coinId, currency, days),
    queryFn: async () => {
      const { data } = await coinGeckoAxios.get<CoinGeckoMarketChartData>(
        `${COINGECKO_API_BASE_URL}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: currency,
            days,
            interval: days === 1 ? 'hourly' : 'daily',
          },
        },
      );
      return data;
    },
    enabled: enabled && !!coinId,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    placeholderData: keepPreviousData,
  });
};

// Processed market chart data for easy chart usage
export const useCoinGeckoProcessedChartData = (
  coinId: string,
  currency: string = 'usd',
  days: number | string = 30,
  enabled: boolean = true,
) => {
  return useQuery<ProcessedChartData>({
    queryKey: [...QUERY_KEYS.CoinGecko.MarketChart(coinId, currency, days), 'processed'],
    queryFn: async () => {
      const { data } = await coinGeckoAxios.get<CoinGeckoMarketChartData>(
        `${COINGECKO_API_BASE_URL}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: currency,
            days,
            interval: days === 1 ? 'hourly' : 'daily',
          },
        },
      );

      // Process the data into a more usable format
      const processedData: ChartDataPoint[] = data.prices.map((pricePoint, index) => ({
        timestamp: pricePoint[0],
        price: pricePoint[1],
        marketCap: data.market_caps[index]?.[1] || 0,
        volume: data.total_volumes[index]?.[1] || 0,
      }));

      return {
        prices: processedData,
        period: days.toString(),
        currency,
        coinId,
      };
    },
    enabled: enabled && !!coinId,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    placeholderData: keepPreviousData,
  });
};

// Get detailed coin information
export const useCoinGeckoCoinDetails = (coinId: string, enabled: boolean = true) => {
  return useQuery<CoinGeckoCoinDetails>({
    queryKey: QUERY_KEYS.CoinGecko.CoinDetails(coinId),
    queryFn: async () => {
      const { data } = await coinGeckoAxios.get<CoinGeckoCoinDetails>(`${COINGECKO_API_BASE_URL}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: true,
          developer_data: true,
          sparkline: false,
        },
      });
      return data;
    },
    enabled: enabled && !!coinId,
    staleTime: 600000, // 10 minutes
    placeholderData: keepPreviousData,
  });
};

// Get market data for multiple coins (useful for coin lists)
export const useCoinGeckoMarketData = (coinIds: string[], currency: string = 'usd', enabled: boolean = true) => {
  return useQuery<CoinGeckoCoinInfo[]>({
    queryKey: QUERY_KEYS.CoinGecko.MarketData(coinIds, currency),
    queryFn: async () => {
      const { data } = await coinGeckoAxios.get<CoinGeckoCoinInfo[]>(`${COINGECKO_API_BASE_URL}/coins/markets`, {
        params: {
          vs_currency: currency,
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          per_page: coinIds.length,
          page: 1,
          sparkline: false,
          price_change_percentage: '1h,24h,7d,14d,30d,200d,1y',
        },
      });
      return data;
    },
    enabled: enabled && coinIds.length > 0,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
    placeholderData: keepPreviousData,
  });
};

// Utility hook to get price for a single coin
export const useCoinGeckoPrice = (coinId: string, currency: string = 'usd', enabled: boolean = true) => {
  const { data, ...rest } = useCoinGeckoSimplePrice([coinId], [currency], enabled);

  return {
    ...rest,
    price: data?.[coinId]?.[currency],
    priceChange24h: data?.[coinId]?.[`${currency}_24h_change`],
    marketCap: data?.[coinId]?.[`${currency}_market_cap`],
    volume24h: data?.[coinId]?.[`${currency}_24h_vol`],
    lastUpdated: data?.[coinId]?.last_updated_at,
  };
};

// Utility hook to get multiple coin prices
export const useCoinGeckoPrices = (coinIds: string[], currency: string = 'usd', enabled: boolean = true) => {
  const { data, ...rest } = useCoinGeckoSimplePrice(coinIds, [currency], enabled);

  const prices = coinIds.reduce(
    (acc, coinId) => {
      if (data?.[coinId]) {
        acc[coinId] = {
          price: data[coinId][currency],
          priceChange24h: data[coinId][`${currency}_24h_change`],
          marketCap: data[coinId][`${currency}_market_cap`],
          volume24h: data[coinId][`${currency}_24h_vol`],
          lastUpdated: data[coinId].last_updated_at,
        };
      }
      return acc;
    },
    {} as Record<
      string,
      {
        price: number;
        priceChange24h: number;
        marketCap: number;
        volume24h: number;
        lastUpdated: number;
      }
    >,
  );

  return {
    ...rest,
    prices,
  };
};

// OHLC data for candlestick charts
export const useCoinGeckoOHLC = (
  coinId: string,
  currency: string = 'usd',
  days: number = 30,
  enabled: boolean = true,
) => {
  return useQuery<number[][]>({
    queryKey: [...QUERY_KEYS.CoinGecko.MarketChart(coinId, currency, days), 'ohlc'],
    queryFn: async () => {
      const { data } = await coinGeckoAxios.get<number[][]>(`${COINGECKO_API_BASE_URL}/coins/${coinId}/ohlc`, {
        params: {
          vs_currency: currency,
          days,
        },
      });
      return data;
    },
    enabled: enabled && !!coinId,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    placeholderData: keepPreviousData,
  });
};
