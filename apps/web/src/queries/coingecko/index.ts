import { coinGeckoAxios } from '@/utils/coingeckoAxios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';

import {
  COINGECKO_API_BASE_URL,
  COINGECKO_CURRENCIES,
  COINGECKO_OHLC_AGGREGATION,
  COINGECKO_OHLC_PERIODS,
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
            // Note: market_chart endpoint doesn't support interval parameter
            // Granularity is automatically determined by the days parameter
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
            // Note: market_chart endpoint doesn't support interval parameter
            // Granularity is automatically determined by the days parameter
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
  days: number | string = 30,
  enabled: boolean = true,
) => {
  return useQuery<number[][]>({
    queryKey: [...QUERY_KEYS.CoinGecko.MarketChart(coinId, currency, days), 'ohlc'],
    queryFn: async () => {
      // Handle 'max' case - use market_chart endpoint instead of OHLC range
      if (days === 'max') {
        const { data: marketData } = await coinGeckoAxios.get<CoinGeckoMarketChartData>(
          `${COINGECKO_API_BASE_URL}?path=coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: currency,
              days: 'max',
            },
          },
        );

        // Convert market chart data to OHLC format
        // For max data, we'll create monthly candles from the price data to make it readable
        const ohlcData: number[][] = [];
        const prices = marketData.prices;

        // Group prices by month and create OHLC candles
        const monthlyGroups: { [key: string]: { prices: number[]; timestamps: number[] } } = {};

        prices.forEach(([timestamp, price]) => {
          const date = new Date(timestamp);
          // Get the start of the month
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = { prices: [], timestamps: [] };
          }
          monthlyGroups[monthKey].prices.push(price);
          monthlyGroups[monthKey].timestamps.push(timestamp);
        });

        // Create OHLC candles for each month
        Object.entries(monthlyGroups).forEach(([monthKey, monthData]) => {
          if (monthData.prices.length > 0) {
            // Use the timestamp of the first price point of the month (month start)
            const timestamp = monthData.timestamps[0];
            const open = monthData.prices[0];
            const close = monthData.prices[monthData.prices.length - 1];
            const high = Math.max(...monthData.prices);
            const low = Math.min(...monthData.prices);

            ohlcData.push([timestamp, open, high, low, close]);
          }
        });

        // Sort by timestamp
        ohlcData.sort((a, b) => a[0] - b[0]);

        return ohlcData;
      }

      // Ensure days is a number for the rest of the logic
      const numericDays = typeof days === 'string' ? 365 : days; // Default to 1 year for non-numeric values

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
      startDate.setDate(endDate.getDate() - numericDays);

      const { data } = await coinGeckoAxios.get<number[][]>(
        `${COINGECKO_API_BASE_URL}?path=coins/${coinId}/ohlc/range`,
        {
          params: {
            vs_currency: currency,
            from: Math.floor(startDate.getTime() / 1000), // UNIX timestamp
            to: Math.floor(endDate.getTime() / 1000), // UNIX timestamp
            interval: getOHLCInterval(numericDays),
          },
        },
      );

      // Aggregate the data to achieve the desired candle periods
      const aggregationFactor = getAggregationFactor(numericDays);
      return aggregateOHLCData(data, aggregationFactor);
    },
    enabled: enabled && !!coinId,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    placeholderData: keepPreviousData,
  });
};
