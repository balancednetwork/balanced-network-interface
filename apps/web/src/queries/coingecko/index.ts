import { coinGeckoAxios } from '@/utils/coingeckoAxios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';

import {
  COINGECKO_API_BASE_URL,
  COINGECKO_CURRENCIES,
  COINGECKO_OHLC_PERIODS,
  COINGECKO_OHLC_AGGREGATION,
} from '@/constants/coingecko';
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
      const { data } = await coinGeckoAxios.get<CoinGeckoSimplePrice>(`${COINGECKO_API_BASE_URL}?path=simple/price`, {
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
        `${COINGECKO_API_BASE_URL}?path=coins/${coinId}/market_chart`,
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
        `${COINGECKO_API_BASE_URL}?path=coins/${coinId}/market_chart`,
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
      const { data } = await coinGeckoAxios.get<CoinGeckoCoinDetails>(
        `${COINGECKO_API_BASE_URL}?path=coins/${coinId}`,
        {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: true,
            developer_data: true,
            sparkline: false,
          },
        },
      );
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
      const { data } = await coinGeckoAxios.get<CoinGeckoCoinInfo[]>(`${COINGECKO_API_BASE_URL}?path=coins/markets`, {
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

// Helper function to aggregate OHLC data
const aggregateOHLCData = (data: number[][], aggregationFactor: number): number[][] => {
  if (aggregationFactor <= 1) return data;

  const aggregated: number[][] = [];

  for (let i = 0; i < data.length; i += aggregationFactor) {
    const group = data.slice(i, i + aggregationFactor);
    if (group.length === 0) continue;

    const timestamp = group[0][0]; // Use timestamp from first candle
    const open = group[0][1]; // Open from first candle
    const high = Math.max(...group.map(candle => candle[2])); // Highest high
    const low = Math.min(...group.map(candle => candle[3])); // Lowest low
    const close = group[group.length - 1][4]; // Close from last candle

    aggregated.push([timestamp, open, high, low, close]);
  }

  return aggregated;
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
      // Map days to the appropriate OHLC interval for CoinGecko Pro API
      const getOHLCInterval = (days: number): string => {
        if (days <= 7) return COINGECKO_OHLC_PERIODS['7d']; // Week: hourly
        if (days <= 30) return COINGECKO_OHLC_PERIODS['30d']; // Month: hourly
        return COINGECKO_OHLC_PERIODS['180d']; // 6 months: daily
      };

      // Map days to aggregation factor
      const getAggregationFactor = (days: number): number => {
        if (days <= 7) return COINGECKO_OHLC_AGGREGATION['7d']; // Week: 2h
        if (days <= 30) return COINGECKO_OHLC_AGGREGATION['30d']; // Month: 8h
        return COINGECKO_OHLC_AGGREGATION['180d']; // 6 months: 2d
      };

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data } = await coinGeckoAxios.get<number[][]>(
        `${COINGECKO_API_BASE_URL}?path=coins/${coinId}/ohlc/range`,
        {
          params: {
            vs_currency: currency,
            from: Math.floor(startDate.getTime() / 1000), // UNIX timestamp
            to: Math.floor(endDate.getTime() / 1000), // UNIX timestamp
            interval: getOHLCInterval(days),
          },
        },
      );

      // Aggregate the data to achieve the desired candle periods
      const aggregationFactor = getAggregationFactor(days);
      return aggregateOHLCData(data, aggregationFactor);
    },
    enabled: enabled && !!coinId,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    placeholderData: keepPreviousData,
  });
};
