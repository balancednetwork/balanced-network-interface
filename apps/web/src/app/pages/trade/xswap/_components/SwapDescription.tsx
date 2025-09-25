import React, { useState } from 'react';

import { Currency, Price } from '@balancednetwork/sdk-core';
import { Trans, defineMessage } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { ChartContainer, ChartControlButton, ChartControlGroup } from '@/app/components/ChartControl';
import Modal from '@/app/components/Modal';
import Spinner from '@/app/components/Spinner';
import { TVChartContainer } from '@/app/components/TradingViewAdvanced/TVChartContainer';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS } from '@/app/components/TradingViewChart';
import { Typography } from '@/app/theme';
import { LanguageCode, ResolutionString } from '@/charting_library/charting_library';
import { ORACLE_PRICED_TOKENS, SUPPORTED_TOKENS_LIST, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import { useV2Pair } from '@/hooks/useV2Pairs';
import useWidth from '@/hooks/useWidth';
import { useIconReact } from '@/packages/icon-react';
import { usePriceChartDataQuery } from '@/queries/swap';
import { useRatio } from '@/store/ratio/hooks';
import { useDerivedTradeInfo, useSwapActionHandlers } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { toFraction } from '@/utils';
import { formatSymbol, formatUnitPrice } from '@/utils/formatter';
import { bnJs } from '@balancednetwork/xwagmi';
import { useCoinGeckoProcessedChartData } from '@/queries/coingecko';
import { COINGECKO_COIN_IDS } from '@/constants/coingecko';

const CHART_TYPES_LABELS = {
  [CHART_TYPES.AREA]: defineMessage({ message: 'Line' }),
  [CHART_TYPES.CANDLE]: defineMessage({ message: 'Candles' }),
};

const CHART_PERIODS_LABELS = {
  [CHART_PERIODS['15m']]: defineMessage({ message: '15m' }),
  [CHART_PERIODS['1H']]: defineMessage({ message: '1H' }),
  [CHART_PERIODS['4H']]: defineMessage({ message: '4H' }),
  [CHART_PERIODS['1D']]: defineMessage({ message: '1D' }),
  [CHART_PERIODS['1W']]: defineMessage({ message: '1W' }),
};

export default function SwapDescription() {
  const { exchangeRate, currencies: XCurrencies } = useDerivedTradeInfo();
  const [tradingViewActive, setTradingViewActive] = useState(false);

  const [chartOption, setChartOption] = React.useState<{ type: CHART_TYPES; period: CHART_PERIODS }>({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['1D'],
  });

  const handleChartPeriodChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setChartOption({
      ...chartOption,
      period: event.currentTarget.value as CHART_PERIODS,
    });
  };

  const handleChartTypeChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setChartOption({
      ...chartOption,
      type: event.currentTarget.value as CHART_TYPES,
    });
  };

  const inputCoinId = XCurrencies[Field.INPUT]?.symbol ? COINGECKO_COIN_IDS[XCurrencies[Field.INPUT]?.symbol!] : null;
  const outputCoinId = XCurrencies[Field.OUTPUT]?.symbol
    ? COINGECKO_COIN_IDS[XCurrencies[Field.OUTPUT]?.symbol!]
    : null;

  const { data: chartDataForInput, isLoading: chartForInputLoading } = useCoinGeckoProcessedChartData(
    inputCoinId || '',
    'usd',
    30, // 30 days
    !!inputCoinId, // Only enable if coin ID exists
  );

  const { data: chartDataForOutput, isLoading: chartForOutputLoading } = useCoinGeckoProcessedChartData(
    outputCoinId || '',
    'usd',
    30, // 30 days
    !!outputCoinId, // Only enable if coin ID exists
  );

  // Convert CoinGecko data to TradingView format
  const convertToTradingViewFormat = (coinGeckoData: any) => {
    if (!coinGeckoData?.prices) return [];

    return coinGeckoData.prices.map((point: any) => ({
      time: Math.floor(point.timestamp / 1000) as any, // Convert to seconds
      value: point.price,
    }));
  };

  const inputChartData = convertToTradingViewFormat(chartDataForInput);
  const outputChartData = convertToTradingViewFormat(chartDataForOutput);

  const [ref, width] = useWidth();

  const { account } = useIconReact();
  const symbolName = `${formatSymbol(XCurrencies[Field.INPUT]?.symbol)} / ${formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)}`;
  // const isSuperSmall = useMedia('(max-width: 359px)');

  // const hasTradingView = React.useMemo(() => {
  //   return (
  //     SUPPORTED_TOKENS_LIST.some(token => token.symbol === XCurrencies[Field.INPUT]?.symbol) &&
  //     SUPPORTED_TOKENS_LIST.some(token => token.symbol === XCurrencies[Field.OUTPUT]?.symbol)
  //   );
  // }, [XCurrencies[Field.INPUT]?.symbol, XCurrencies[Field.OUTPUT]?.symbol]);

  // const [, pair] = useV2Pair(XCurrencies[Field.INPUT], XCurrencies[Field.OUTPUT]);

  // const hasChart = React.useMemo(() => {
  //   const pairExists = !!pair;
  //   const isOraclePriced =
  //     ORACLE_PRICED_TOKENS.includes(XCurrencies[Field.INPUT]?.symbol!) ||
  //     ORACLE_PRICED_TOKENS.includes(XCurrencies[Field.OUTPUT]?.symbol!);

  //   return pairExists && !isOraclePriced;
  // }, [pair, XCurrencies[Field.INPUT]?.symbol, XCurrencies[Field.OUTPUT]?.symbol]);

  return (
    <Flex bg="bg2" flex={1} flexDirection="column" p={[5, 7]}>
      <Flex mb={5} flexWrap="wrap">
        <Box width={[1, 1 / 2]}>
          <Typography variant="h3" mb={2}>
            {symbolName}
          </Typography>

          {/* {hasChart && (
            <>
              <Typography variant="p">
                <Trans>
                  {`${exchangeRate ? formatUnitPrice(exchangeRate.toFixed(10)) : '...'} 
                    ${formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)} per ${formatSymbol(XCurrencies[Field.INPUT]?.symbol)} `}
                </Trans>
              </Typography>
            </>
          )} */}
        </Box>
        <Box width={[1, 1 / 2]}></Box>
        {/* <Box width={[1, 1 / 2]} marginTop={[3, 0]} hidden={!hasChart || pair?.poolId === 1}>
          <ChartControlGroup mb={2}>
            {Object.keys(CHART_PERIODS).map(key => (
              <ChartControlButton
                key={key}
                type="button"
                value={CHART_PERIODS[key]}
                onClick={handleChartPeriodChange}
                $active={chartOption.period === CHART_PERIODS[key]}
              >
                <Trans id={CHART_PERIODS_LABELS[CHART_PERIODS[key]].id} />
              </ChartControlButton>
            ))}
          </ChartControlGroup>

          <ChartControlGroup>
            {Object.keys(CHART_TYPES).map(key => (
              <ChartControlButton
                key={key}
                type="button"
                value={CHART_TYPES[key]}
                onClick={handleChartTypeChange}
                $active={chartOption.type === CHART_TYPES[key]}
              >
                <Trans id={CHART_TYPES_LABELS[CHART_TYPES[key]].id} />
              </ChartControlButton>
            ))}

            {!isSuperSmall && hasTradingView && (
              <ChartControlButton type="button" onClick={() => setTradingViewActive(true)} $active={tradingViewActive}>
                TradingView
              </ChartControlButton>
            )}
          </ChartControlGroup>
        </Box> */}
      </Flex>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Input Token Chart */}
        <Box mb={4}>
          <Typography variant="h4" mb={2}>
            {formatSymbol(XCurrencies[Field.INPUT]?.symbol)} Price Chart (30 days)
          </Typography>
          <ChartContainer width="100%" ref={ref}>
            {!inputCoinId ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>Chart not available for {formatSymbol(XCurrencies[Field.INPUT]?.symbol)}</Trans>
                </Typography>
              </Flex>
            ) : chartForInputLoading ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Spinner />
              </Flex>
            ) : inputChartData.length > 0 ? (
              <TradingViewChart type={CHART_TYPES.AREA} data={inputChartData} volumeData={[]} width={width} />
            ) : (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>No chart data available for {formatSymbol(XCurrencies[Field.INPUT]?.symbol)}</Trans>
                </Typography>
              </Flex>
            )}
          </ChartContainer>
        </Box>

        {/* Output Token Chart */}
        <Box>
          <Typography variant="h4" mb={2}>
            {formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)} Price Chart (30 days)
          </Typography>
          <ChartContainer width="100%">
            {!outputCoinId ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>Chart not available for {formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)}</Trans>
                </Typography>
              </Flex>
            ) : chartForOutputLoading ? (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Spinner />
              </Flex>
            ) : outputChartData.length > 0 ? (
              <TradingViewChart type={CHART_TYPES.AREA} data={outputChartData} volumeData={[]} width={width} />
            ) : (
              <Flex justifyContent="center" alignItems="center" height="300px">
                <Typography>
                  <Trans>No chart data available for {formatSymbol(XCurrencies[Field.OUTPUT]?.symbol)}</Trans>
                </Typography>
              </Flex>
            )}
          </ChartContainer>
        </Box>
      </div>
    </Flex>
  );
}

const TVChartContainerWrap = styled(Flex)`
  left: 0;
  top: 0;
  z-index: 99999;
  width: 100%;

  .TVChartContainer {
    width: 100%;
  }

  iframe {
    width: 100%;
    height: 100%;
  }
`;
