import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { theme } from '@/app/theme';
import { useCoinGeckoAnalytics } from '@/hooks/useCoinGeckoAnalytics';
import { setSwapContext } from '@/utils/coingeckoAxios';
import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled, { keyframes } from 'styled-components';

import { ChartContainer, ChartControlButton, ChartControlGroup } from '@/app/components/ChartControl';
import Spinner from '@/app/components/Spinner';
import TradingViewChart, { CHART_TYPES } from '@/app/components/TradingViewChart';
import { Typography } from '@/app/theme';
import { COINGECKO_COIN_IDS } from '@/constants/coingecko';
import { useTokenPricesWithPyth } from '@/queries/backendv2';
import {
  useCoinGeckoOHLC,
  useCoinGeckoPrice,
  useCoinGeckoProcessedChartData,
  useCoinGeckoSimplePrice,
} from '@/queries/coingecko';
import { useDerivedTradeInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatPrice, formatSymbol } from '@/utils/formatter';

// Timeframe options
const TIMEFRAMES = {
  '7d': { label: 'Week', days: 7 },
  '1m': { label: 'Month', days: 30 },
  '6m': { label: '6 Months', days: 180 },
  max: { label: 'All time', days: 'max' },
} as const;

type TimeframeKey = keyof typeof TIMEFRAMES;

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(4px);
  }
`;

// Styled component for animated chart container
const AnimatedChartContainer = styled.div<{ $isExiting?: boolean }>`
  animation: ${props => (props.$isExiting ? fadeOut : fadeIn)} 0.3s ease-out;
`;

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
  const [isChartExiting, setIsChartExiting] = useState(false);

  // Initialize CoinGecko analytics tracking
  useCoinGeckoAnalytics();

  // Get Pyth prices as backup
  const pythPrices = useTokenPricesWithPyth();

  const selectedCoinId = useMemo(
    () => (XCurrencies[selectedToken]?.symbol ? COINGECKO_COIN_IDS[XCurrencies[selectedToken]?.symbol!] : null),
    [XCurrencies, selectedToken],
  );

  const {
    data: chartDataForSelected,
    isLoading: chartLoading,
    isFetching: chartFetching,
  } = useCoinGeckoProcessedChartData(
    selectedCoinId || '',
    'usd',
    TIMEFRAMES[selectedTimeframe].days,
    !!selectedCoinId && selectedChartType === CHART_TYPES.AREA, // Only fetch line chart data when area chart is selected
  );

  const {
    data: ohlcData,
    isLoading: ohlcLoading,
    isFetching: ohlcFetching,
  } = useCoinGeckoOHLC(
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
  // Use CoinGecko first, fallback to Pyth if CoinGecko price is not available
  const currentPrices = useMemo(() => {
    const prices: Record<string, number | null> = {};

    // Get input token price
    if (inputCoinId && realTimePriceData?.[inputCoinId]?.usd) {
      prices.input = realTimePriceData[inputCoinId].usd;
    } else if (XCurrencies[Field.INPUT]?.symbol && pythPrices?.[XCurrencies[Field.INPUT].symbol]) {
      // Fallback to Pyth price
      prices.input = pythPrices[XCurrencies[Field.INPUT].symbol].toNumber();
    }

    // Get output token price
    if (outputCoinId && realTimePriceData?.[outputCoinId]?.usd) {
      prices.output = realTimePriceData[outputCoinId].usd;
    } else if (XCurrencies[Field.OUTPUT]?.symbol && pythPrices?.[XCurrencies[Field.OUTPUT].symbol]) {
      // Fallback to Pyth price
      prices.output = pythPrices[XCurrencies[Field.OUTPUT].symbol].toNumber();
    }

    return prices;
  }, [realTimePriceData, inputCoinId, outputCoinId, pythPrices, XCurrencies]);

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
    () => formatSymbol(XCurrencies[Field.INPUT]?.symbol).replace('(old)', ''),
    [XCurrencies[Field.INPUT]?.symbol],
  );

  const outputTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[Field.OUTPUT]?.symbol).replace('(old)', ''),
    [XCurrencies[Field.OUTPUT]?.symbol],
  );

  const selectedTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[selectedToken]?.symbol).replace('(old)', ''),
    [XCurrencies, selectedToken],
  );

  // Check if both input and output tokens are the same
  const isSameToken = useMemo(() => {
    return (
      XCurrencies[Field.INPUT]?.symbol?.replace('(old)', '') === XCurrencies[Field.OUTPUT]?.symbol?.replace('(old)', '')
    );
  }, [XCurrencies]);

  // Set CoinGecko swap context for analytics tracking
  useEffect(() => {
    if (inputTokenSymbol && outputTokenSymbol) {
      setSwapContext({ from: inputTokenSymbol, to: outputTokenSymbol });
    }
  }, [inputTokenSymbol, outputTokenSymbol]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback(
    (timeframe: TimeframeKey) => {
      if (timeframe !== selectedTimeframe) {
        setIsChartExiting(true);
        setTimeout(() => {
          setSelectedTimeframe(timeframe);
          setIsChartExiting(false);
        }, 300); // Match animation duration
      }
    },
    [selectedTimeframe],
  );

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
  const handleChartTypeChange = useCallback(
    (chartType: CHART_TYPES) => {
      if (chartType !== selectedChartType) {
        setIsChartExiting(true);
        setTimeout(() => {
          setSelectedChartType(chartType);
          setIsChartExiting(false);
        }, 300); // Match animation duration
      }
    },
    [selectedChartType],
  );

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
                  <Trans>Chart not available for {selectedTokenSymbol}.</Trans>
                </Typography>
              </Flex>
            ) : chartLoading || ohlcLoading || chartFetching || ohlcFetching ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Spinner />
              </Flex>
            ) : chartData.length > 0 ? (
              <AnimatedChartContainer $isExiting={isChartExiting}>
                <MemoizedTradingViewChart {...chartProps} />
              </AnimatedChartContainer>
            ) : (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>No chart data available for {selectedTokenSymbol}.</Trans>
                </Typography>
              </Flex>
            )}
          </ChartContainer>
        </Box>
      </div>
    </Flex>
  );
}
