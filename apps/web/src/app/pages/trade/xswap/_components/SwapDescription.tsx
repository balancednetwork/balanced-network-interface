import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { ChartContainer, ChartControlButton, ChartControlGroup } from '@/app/components/ChartControl';
import Spinner from '@/app/components/Spinner';
import TradingViewChart, { CHART_TYPES } from '@/app/components/TradingViewChart';
import { Typography } from '@/app/theme';
import { useDerivedTradeInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatSymbol } from '@/utils/formatter';
import { useCoinGeckoProcessedChartData } from '@/queries/coingecko';
import { COINGECKO_COIN_IDS } from '@/constants/coingecko';

// Timeframe options
const TIMEFRAMES = {
  '7d': { label: '7D', days: 7 },
  '1m': { label: '1M', days: 30 },
  '6m': { label: '6M', days: 180 },
  '1y': { label: '1Y', days: 365 },
} as const;

type TimeframeKey = keyof typeof TIMEFRAMES;

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

  const inputCoinId = useMemo(
    () => (XCurrencies[Field.INPUT]?.symbol ? COINGECKO_COIN_IDS[XCurrencies[Field.INPUT]?.symbol!] : null),
    [XCurrencies[Field.INPUT]?.symbol],
  );

  const { data: chartDataForInput, isLoading: chartForInputLoading } = useCoinGeckoProcessedChartData(
    inputCoinId || '',
    'usd',
    TIMEFRAMES[selectedTimeframe].days,
    !!inputCoinId, // Only enable if coin ID exists
  );

  // Convert CoinGecko data to TradingView format
  const convertToTradingViewFormat = useCallback((coinGeckoData: any) => {
    if (!coinGeckoData?.prices) return [];

    return coinGeckoData.prices.map((point: any) => ({
      time: Math.floor(point.timestamp / 1000) as any, // Convert to seconds
      value: point.price,
    }));
  }, []);

  const inputChartData = useMemo(
    () => convertToTradingViewFormat(chartDataForInput),
    [chartDataForInput, convertToTradingViewFormat],
  );

  const [ref, width] = useStableWidth();

  const symbolName = useMemo(
    () => `${formatSymbol(XCurrencies[Field.INPUT]?.symbol)} / ${formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)}`,
    [XCurrencies[Field.INPUT]?.symbol, XCurrencies[Field.OUTPUT]?.symbol],
  );

  const inputTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[Field.INPUT]?.symbol),
    [XCurrencies[Field.INPUT]?.symbol],
  );

  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe: TimeframeKey) => {
    setSelectedTimeframe(timeframe);
  }, []);

  // Memoize chart props to prevent unnecessary re-renders
  const chartProps = useMemo(
    () => ({
      type: CHART_TYPES.AREA,
      data: inputChartData,
      volumeData: [] as any[],
      width: width,
    }),
    [inputChartData, width],
  );

  return (
    <Flex bg="bg2" flex={1} flexDirection="column" p={[5, 7]}>
      <Flex mb={5} width="100%" flexWrap="wrap" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" mb={2}>
          {symbolName}
        </Typography>
        <ChartControlGroup pb={'12px'}>
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
      </Flex>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Input Token Chart */}
        <Box mt={3}>
          <ChartContainer width="100%" ref={ref}>
            {!inputCoinId ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>Chart not available for {inputTokenSymbol}</Trans>
                </Typography>
              </Flex>
            ) : chartForInputLoading ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Spinner />
              </Flex>
            ) : inputChartData.length > 0 ? (
              <MemoizedTradingViewChart {...chartProps} />
            ) : (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>No chart data available for {inputTokenSymbol}</Trans>
                </Typography>
              </Flex>
            )}
          </ChartContainer>
        </Box>
      </div>
    </Flex>
  );
}
