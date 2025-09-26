import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';
import { theme } from '@/app/theme';

import { ChartContainer, ChartControlButton, ChartControlGroup } from '@/app/components/ChartControl';
import Spinner from '@/app/components/Spinner';
import TradingViewChart, { CHART_TYPES } from '@/app/components/TradingViewChart';
import { Typography } from '@/app/theme';
import { useDerivedTradeInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatSymbol, formatPrice } from '@/utils/formatter';
import { useCoinGeckoProcessedChartData, useCoinGeckoPrice } from '@/queries/coingecko';
import { COINGECKO_COIN_IDS } from '@/constants/coingecko';

// Timeframe options
const TIMEFRAMES = {
  '7d': { label: '7D', days: 7 },
  '1m': { label: '1M', days: 30 },
  '6m': { label: '6M', days: 180 },
  '1y': { label: '1Y', days: 365 },
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

  const selectedCoinId = useMemo(
    () => (XCurrencies[selectedToken]?.symbol ? COINGECKO_COIN_IDS[XCurrencies[selectedToken]?.symbol!] : null),
    [XCurrencies, selectedToken],
  );

  const { data: chartDataForSelected, isLoading: chartLoading } = useCoinGeckoProcessedChartData(
    selectedCoinId || '',
    'usd',
    TIMEFRAMES[selectedTimeframe].days,
    !!selectedCoinId, // Only enable if coin ID exists
  );

  const { price: currentPrice, isLoading: priceLoading } = useCoinGeckoPrice(
    selectedCoinId || '',
    'usd',
    !!selectedCoinId, // Only enable if coin ID exists
  );

  // Convert CoinGecko data to TradingView format
  const convertToTradingViewFormat = useCallback((coinGeckoData: any) => {
    if (!coinGeckoData?.prices) return [];

    return coinGeckoData.prices.map((point: any) => ({
      time: Math.floor(point.timestamp / 1000) as any, // Convert to seconds
      value: point.price,
    }));
  }, []);

  const chartData = useMemo(
    () => convertToTradingViewFormat(chartDataForSelected),
    [chartDataForSelected, convertToTradingViewFormat],
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

  const outputTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[Field.OUTPUT]?.symbol),
    [XCurrencies[Field.OUTPUT]?.symbol],
  );

  const selectedTokenSymbol = useMemo(
    () => formatSymbol(XCurrencies[selectedToken]?.symbol),
    [XCurrencies, selectedToken],
  );

  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe: TimeframeKey) => {
    setSelectedTimeframe(timeframe);
  }, []);

  // Handle token selection
  const handleTokenSelect = useCallback((token: Field) => {
    setSelectedToken(token);
  }, []);

  // Memoize chart props to prevent unnecessary re-renders
  const chartProps = useMemo(
    () => ({
      type: CHART_TYPES.AREA,
      data: chartData,
      volumeData: [] as any[],
      width: width,
    }),
    [chartData, width],
  );

  return (
    <Flex bg="bg2" flex={1} flexDirection="column" p={[5, 7]}>
      <Flex mb={5} width="100%" flexWrap="wrap" justifyContent="space-between">
        <Box>
          <Flex alignItems="center" mb={2}>
            <ClickableTokenSymbol
              variant="h3"
              $isActive={selectedToken === Field.INPUT}
              onClick={() => handleTokenSelect(Field.INPUT)}
            >
              {inputTokenSymbol}
            </ClickableTokenSymbol>
            <Typography variant="h3" style={{ marginRight: '8px' }}>
              {' '}
              /{' '}
            </Typography>
            <ClickableTokenSymbol
              variant="h3"
              $isActive={selectedToken === Field.OUTPUT}
              onClick={() => handleTokenSelect(Field.OUTPUT)}
            >
              {outputTokenSymbol}
            </ClickableTokenSymbol>
          </Flex>

          {/* Price Display */}
          {selectedCoinId && (
            <Box>
              <Typography variant="p" color="text1">
                {selectedTokenSymbol} price: {priceLoading ? '...' : currentPrice ? formatPrice(currentPrice) : '-'}
              </Typography>
            </Box>
          )}
        </Box>
        <ChartControlGroup py={'3px'}>
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
            {!selectedCoinId ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>Chart not available for {selectedTokenSymbol}</Trans>
                </Typography>
              </Flex>
            ) : chartLoading ? (
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
