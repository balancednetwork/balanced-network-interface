import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';
import { theme } from '@/app/theme';
import { useCoinGeckoAnalytics } from '@/hooks/useCoinGeckoAnalytics';
import { setSwapContext } from '@/utils/coingeckoAxios';

import { ChartContainer, ChartControlButton, ChartControlGroup } from '@/app/components/ChartControl';
import Spinner from '@/app/components/Spinner';
import TradingViewChart, { CHART_TYPES } from '@/app/components/TradingViewChart';
import { Typography } from '@/app/theme';
import { useDerivedTradeInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatSymbol, formatPrice } from '@/utils/formatter';
import {
  useCoinGeckoProcessedChartData,
  useCoinGeckoPrice,
  useCoinGeckoOHLC,
  useCoinGeckoSimplePrice,
} from '@/queries/coingecko';
import { COINGECKO_COIN_IDS } from '@/constants/coingecko';

// Timeframe options
const TIMEFRAMES = {
  '7d': { label: 'Week', days: 7 },
  '1m': { label: 'Month', days: 30 },
  '6m': { label: '6 Months', days: 180 },
  '1y': { label: 'Year', days: 365 },
} as const;

type TimeframeKey = keyof typeof TIMEFRAMES;

// Styled component for clickable token symbols with animated border
const ClickableTokenSymbol = styled(Typography)<{ $isActive: boolean }>`
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  margin-right: 8px;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    height: 2px;
    background-color: ${({ $isActive }) => ($isActive ? theme().colors.primary : 'transparent')};
    transition: all 0.3s ease;
    width: ${({ $isActive }) => ($isActive ? '100%' : '0%')};
  }

  &:hover::after {
    width: 100%;
    background-color: ${theme().colors.primary};
  }
`;

// Custom hook for stable width measurement using ResizeObserver
const useStableWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Set initial width
    const updateWidth = () => {
      const newWidth = element.clientWidth;
      if (newWidth !== width) {
        setWidth(newWidth);
      }
    };

    updateWidth();

    // Use ResizeObserver for more stable width tracking
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth !== width && newWidth > 0) {
          setWidth(newWidth);
        }
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width]);

  return [ref, width] as const;
};

// Memoized chart component to prevent unnecessary re-renders
const MemoizedTradingViewChart = React.memo(TradingViewChart, (prevProps, nextProps) => {
  // Only re-render if data, width, or type actually changes
  return (
    prevProps.data === nextProps.data &&
    prevProps.width === nextProps.width &&
    prevProps.type === nextProps.type &&
    prevProps.volumeData === nextProps.volumeData
  );
});

export default function SwapDescription() {
  const { currencies: XCurrencies } = useDerivedTradeInfo();
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeKey>('6m');
  const [selectedToken, setSelectedToken] = useState<Field>(Field.INPUT);
  const [selectedChartType, setSelectedChartType] = useState<CHART_TYPES>(CHART_TYPES.CANDLE);

  // Initialize CoinGecko analytics tracking
  useCoinGeckoAnalytics();

  const selectedCoinId = useMemo(
    () => (XCurrencies[selectedToken]?.symbol ? COINGECKO_COIN_IDS[XCurrencies[selectedToken]?.symbol!] : null),
    [XCurrencies, selectedToken],
  );

  const { data: chartDataForSelected, isLoading: chartLoading } = useCoinGeckoProcessedChartData(
    selectedCoinId || '',
    'usd',
    TIMEFRAMES[selectedTimeframe].days,
    !!selectedCoinId && selectedChartType === CHART_TYPES.AREA, // Only fetch line chart data when area chart is selected
  );

  const { data: ohlcData, isLoading: ohlcLoading } = useCoinGeckoOHLC(
    selectedCoinId || '',
    'usd',
    TIMEFRAMES[selectedTimeframe].days,
    !!selectedCoinId && selectedChartType === CHART_TYPES.CANDLE, // Only fetch OHLC for candlestick charts
  );

  // Get current prices for both input and output tokens
  const inputCoinId = XCurrencies[Field.INPUT]?.symbol ? COINGECKO_COIN_IDS[XCurrencies[Field.INPUT].symbol] : null;
  const outputCoinId = XCurrencies[Field.OUTPUT]?.symbol ? COINGECKO_COIN_IDS[XCurrencies[Field.OUTPUT].symbol] : null;
  const allCoinIds = [inputCoinId, outputCoinId].filter(Boolean);

  const { data: realTimePriceData, isLoading: currentPriceLoading } = useCoinGeckoSimplePrice(
    allCoinIds,
    ['usd'],
    allCoinIds.length > 0, // Fetch prices for all tokens
  );

  // Extract current prices for both tokens - always show the correct price regardless of chart selection
  const currentPrices = useMemo(() => {
    const prices: Record<string, number | null> = {};
    if (realTimePriceData) {
      if (inputCoinId && realTimePriceData[inputCoinId]?.usd) {
        prices.input = realTimePriceData[inputCoinId].usd;
      }
      if (outputCoinId && realTimePriceData[outputCoinId]?.usd) {
        prices.output = realTimePriceData[outputCoinId].usd;
      }
    }
    return prices;
  }, [realTimePriceData, inputCoinId, outputCoinId]);

  const priceLoading = currentPriceLoading;

  // Convert CoinGecko data to TradingView format
  const convertToTradingViewFormat = useCallback((coinGeckoData: any) => {
    if (!coinGeckoData?.prices) return [];

    return coinGeckoData.prices.map((point: any) => ({
      time: Math.floor(point.timestamp / 1000) as any, // Convert to seconds
      value: point.price,
    }));
  }, []);

  // Convert OHLC data to TradingView candlestick format, updating the latest candle with real-time price
  const convertOHLCToTradingViewFormat = useCallback(
    (ohlcData: number[][]) => {
      if (!ohlcData) return [];

      const convertedData = ohlcData.map((candle: number[]) => ({
        time: Math.floor(candle[0] / 1000) as any, // Convert timestamp to seconds
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
      }));

      // Update the latest candle with real-time price if available
      if (realTimePriceData && selectedCoinId && realTimePriceData[selectedCoinId]?.usd && convertedData.length > 0) {
        const latestCandle = convertedData[convertedData.length - 1];
        const realTimePrice = realTimePriceData[selectedCoinId].usd;

        // Update close price and adjust high/low if necessary
        latestCandle.close = realTimePrice;
        if (realTimePrice > latestCandle.high) {
          latestCandle.high = realTimePrice;
        }
        if (realTimePrice < latestCandle.low) {
          latestCandle.low = realTimePrice;
        }
      }

      return convertedData;
    },
    [realTimePriceData, selectedCoinId],
  );

  const chartData = useMemo(() => {
    if (selectedChartType === CHART_TYPES.CANDLE) {
      return convertOHLCToTradingViewFormat(ohlcData || []);
    } else {
      return convertToTradingViewFormat(chartDataForSelected);
    }
  }, [chartDataForSelected, ohlcData, selectedChartType, convertToTradingViewFormat, convertOHLCToTradingViewFormat]);

  const [ref, width] = useStableWidth();

  const symbolName = useMemo(
    () => `${formatSymbol(XCurrencies[Field.INPUT]?.symbol)} / ${formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)}`,
    [XCurrencies[Field.INPUT]?.symbol, XCurrencies[Field.OUTPUT]?.symbol],
  );

  const inputTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[Field.INPUT]?.symbol),
    [XCurrencies[Field.INPUT]?.symbol],
  );

  const outputTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[Field.OUTPUT]?.symbol),
    [XCurrencies[Field.OUTPUT]?.symbol],
  );

  const selectedTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[selectedToken]?.symbol),
    [XCurrencies, selectedToken],
  );

  // Check if both input and output tokens are the same
  const isSameToken = useMemo(() => {
    return XCurrencies[Field.INPUT]?.symbol === XCurrencies[Field.OUTPUT]?.symbol;
  }, [XCurrencies]);

  // Set CoinGecko swap context for analytics tracking
  useEffect(() => {
    if (inputTokenSymbol && outputTokenSymbol) {
      setSwapContext({ from: inputTokenSymbol, to: outputTokenSymbol });
    }
  }, [inputTokenSymbol, outputTokenSymbol]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe: TimeframeKey) => {
    setSelectedTimeframe(timeframe);
  }, []);

  // Handle token selection
  const handleTokenSelect = useCallback((token: Field) => {
    setSelectedToken(token);
  }, []);

  // Auto-select input token when both tokens are the same
  useEffect(() => {
    if (isSameToken) {
      setSelectedToken(Field.INPUT);
    }
  }, [isSameToken]);

  // Handle chart type change
  const handleChartTypeChange = useCallback((chartType: CHART_TYPES) => {
    setSelectedChartType(chartType);
  }, []);

  // Memoize chart props to prevent unnecessary re-renders
  const chartProps = useMemo(
    () => ({
      type: selectedChartType,
      data: chartData,
      volumeData: [] as any[],
      width: width,
    }),
    [chartData, width, selectedChartType],
  );

  return (
    <Flex bg="bg2" flex={1} flexDirection="column" p={[5, 7]}>
      <Flex
        mb={5}
        width="100%"
        justifyContent="space-between"
        flexDirection={['column', 'row', 'column', 'column', 'row']}
      >
        <Box>
          {/* Price History Header */}
          <Typography variant="h3" mb="7px">
            Price history
          </Typography>

          {/* Token Prices */}
          <Flex alignItems="center" mb={3}>
            {isSameToken ? (
              // Show only one token when both are the same
              <Typography variant="p" color="text1">
                {inputTokenSymbol}:{' '}
                {priceLoading ? '...' : currentPrices.input ? formatPrice(currentPrices.input) : '-'}
              </Typography>
            ) : (
              // Show both tokens when they are different
              <>
                <ClickableTokenSymbol
                  variant="p"
                  color="text1"
                  $isActive={selectedToken === Field.INPUT}
                  onClick={() => handleTokenSelect(Field.INPUT)}
                  style={{ marginRight: '12px' }}
                >
                  {inputTokenSymbol}:{' '}
                  {priceLoading ? '...' : currentPrices.input ? formatPrice(currentPrices.input) : '-'}
                </ClickableTokenSymbol>

                <Typography variant="p" color="text1" mr="12px">
                  /
                </Typography>

                <ClickableTokenSymbol
                  variant="p"
                  color="text1"
                  $isActive={selectedToken === Field.OUTPUT}
                  onClick={() => handleTokenSelect(Field.OUTPUT)}
                >
                  {outputTokenSymbol}:{' '}
                  {priceLoading ? '...' : currentPrices.output ? formatPrice(currentPrices.output) : '-'}
                </ClickableTokenSymbol>
              </>
            )}
          </Flex>
        </Box>

        {/* Chart Controls */}
        <Flex flexDirection="column" alignItems={['flex-start', 'flex-end', 'flex-start', 'flex-start', 'flex-end']}>
          <ChartControlGroup pt={'3px'} mb={2}>
            {Object.entries(TIMEFRAMES).map(([key, timeframe]) => (
              <ChartControlButton
                key={key}
                type="button"
                onClick={() => handleTimeframeChange(key as TimeframeKey)}
                $active={selectedTimeframe === key}
              >
                <Typography fontSize={12}>{timeframe.label}</Typography>
              </ChartControlButton>
            ))}
          </ChartControlGroup>

          <ChartControlGroup pb={'3px'}>
            <ChartControlButton
              type="button"
              onClick={() => handleChartTypeChange(CHART_TYPES.CANDLE)}
              $active={selectedChartType === CHART_TYPES.CANDLE}
            >
              <Typography fontSize={12}>Candles</Typography>
            </ChartControlButton>
            <ChartControlButton
              type="button"
              onClick={() => handleChartTypeChange(CHART_TYPES.AREA)}
              $active={selectedChartType === CHART_TYPES.AREA}
            >
              <Typography fontSize={12}>Line</Typography>
            </ChartControlButton>
          </ChartControlGroup>
        </Flex>
      </Flex>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Input Token Chart */}
        <Box mt={3}>
          <ChartContainer width="100%" ref={ref}>
            {!selectedCoinId ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>Chart not available for {selectedTokenSymbol}</Trans>
                </Typography>
              </Flex>
            ) : chartLoading || (selectedChartType === CHART_TYPES.CANDLE && ohlcLoading) ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Spinner />
              </Flex>
            ) : chartData.length > 0 ? (
              <MemoizedTradingViewChart {...chartProps} />
            ) : (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>No chart data available for {selectedTokenSymbol}</Trans>
                </Typography>
              </Flex>
            )}
          </ChartContainer>
        </Box>
      </div>
    </Flex>
  );
}
