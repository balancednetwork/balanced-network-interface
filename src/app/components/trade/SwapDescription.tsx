import React, { useState } from 'react';

import { defineMessage, Trans } from '@lingui/macro';
import { ResolutionString } from 'charting_library/charting_library';
import JSBI from 'jsbi';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { TVChartContainer } from 'app/components/TradingViewAdvanced/TVChartContainer';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { getTradePair, isQueue } from 'constants/currency';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS, SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import useWidth from 'hooks/useWidth';
import { usePriceChartDataQuery } from 'queries/swap';
import { useRatio } from 'store/ratio/hooks';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo, useSwapActionHandlers } from 'store/swap/hooks';
import { Price, Currency } from 'types/balanced-sdk-core';
import { generateChartData, toFraction } from 'utils';

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
  const { currencies, price } = useDerivedSwapInfo();
  const [tradingViewActive, setTradingViewActive] = useState(false);

  const [chartOption, setChartOption] = React.useState<{ type: CHART_TYPES; period: CHART_PERIODS }>({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['1H'],
  });

  const [ref, width] = useWidth();

  const priceChartQuery = usePriceChartDataQuery(currencies, chartOption.period);
  const data = priceChartQuery.data;
  const loading = priceChartQuery.isLoading;

  const ratio = useRatio();
  const queueData: any = React.useMemo(
    () => generateChartData(ratio.sICXICXratio, { INPUT: currencies.INPUT, OUTPUT: currencies.OUTPUT }),
    [ratio.sICXICXratio, currencies.INPUT, currencies.OUTPUT],
  );

  const qratioFrac = toFraction(ratio.sICXICXratio);

  let priceInICX: Price<Currency, Currency> | undefined;

  if (price && currencies.INPUT && currencies.OUTPUT) {
    priceInICX =
      currencies[Field.OUTPUT]?.wrapped.address === bnJs.sICX.address
        ? new Price(
            currencies.INPUT,
            SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.ICX.address],
            JSBI.multiply(price.denominator, qratioFrac.denominator),
            JSBI.multiply(price.numerator, qratioFrac.numerator),
          )
        : new Price(
            SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.ICX.address],
            currencies.OUTPUT,
            JSBI.multiply(price.denominator, qratioFrac.numerator),
            JSBI.multiply(price.numerator, qratioFrac.denominator),
          );
  }

  const [pair] = getTradePair(currencies[Field.INPUT]?.symbol, currencies[Field.OUTPUT]?.symbol);

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

  const hasSICX = [currencies[Field.INPUT]?.symbol, currencies[Field.OUTPUT]?.symbol].includes('sICX');
  const hasICX = [currencies[Field.INPUT]?.symbol, currencies[Field.OUTPUT]?.symbol].includes('ICX');

  const [activeSymbol, setActiveSymbol] = useState<string | undefined>(undefined);
  const symbolName = `${currencies[Field.INPUT]?.symbol} / ${currencies[Field.OUTPUT]?.symbol}`;
  const isSuperSmall = useMedia('(max-width: 359px)');

  const { onCurrencySelection } = useSwapActionHandlers();

  const handleTVDismiss = () => {
    setTradingViewActive(false);

    if (activeSymbol !== undefined) {
      const tokens = activeSymbol.split('/');

      const inputToken = SUPPORTED_TOKENS_LIST.filter(
        token => token.symbol!.toLowerCase() === tokens[0].toLowerCase(),
      )[0];
      const outputToken = SUPPORTED_TOKENS_LIST.filter(
        token => token.symbol!.toLowerCase() === tokens[1].toLowerCase(),
      )[0];

      if (inputToken && outputToken) {
        onCurrencySelection(Field.INPUT, inputToken);
        onCurrencySelection(Field.OUTPUT, outputToken);
      }
    }
  };

  return (
    <Box bg="bg2" flex={1} p={[5, 7]}>
      <Flex mb={5} flexWrap="wrap">
        <Box width={[1, 1 / 2]}>
          <Typography variant="h3" mb={2}>
            {symbolName}
          </Typography>

          {pair && (
            <>
              <Typography variant="p">
                <Trans>
                  {`${price?.toFixed(4) || '...'} 
                    ${currencies[Field.OUTPUT]?.symbol} per ${currencies[Field.INPUT]?.symbol} `}
                </Trans>
              </Typography>
              {hasSICX && !hasICX && (
                <Typography variant="p" fontSize="14px" color="rgba(255,255,255,0.75)">
                  <Trans>
                    {`${priceInICX?.toFixed(4) || '...'} 
                      ${currencies[Field.OUTPUT]?.symbol === 'sICX' ? 'ICX' : currencies[Field.OUTPUT]?.symbol} 
                      per ${currencies[Field.INPUT]?.symbol === 'sICX' ? 'ICX' : currencies[Field.INPUT]?.symbol} `}
                  </Trans>
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box width={[1, 1 / 2]} marginTop={[3, 0]} hidden={!pair || isQueue(pair)}>
          <ChartControlGroup mb={2}>
            {Object.keys(CHART_PERIODS).map(key => (
              <ChartControlButton
                key={key}
                type="button"
                value={CHART_PERIODS[key]}
                onClick={handleChartPeriodChange}
                active={chartOption.period === CHART_PERIODS[key]}
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
                active={chartOption.type === CHART_TYPES[key]}
              >
                <Trans id={CHART_TYPES_LABELS[CHART_TYPES[key]].id} />
              </ChartControlButton>
            ))}

            {!isSuperSmall && (
              <ChartControlButton type="button" onClick={() => setTradingViewActive(true)} active={tradingViewActive}>
                TradingView
              </ChartControlButton>
            )}
          </ChartControlGroup>
        </Box>
      </Flex>

      <ChartContainer ref={ref}>
        {pair ? (
          <>
            {loading ? (
              <Spinner size={75} centered />
            ) : (
              <>
                {chartOption.type === CHART_TYPES.AREA && (
                  <TradingViewChart
                    data={isQueue(pair) ? queueData : data}
                    volumeData={isQueue(pair) ? queueData : data}
                    width={width}
                    type={CHART_TYPES.AREA}
                  />
                )}

                {chartOption.type === CHART_TYPES.CANDLE && (
                  <TradingViewChart data={data} volumeData={data} width={width} type={CHART_TYPES.CANDLE} />
                )}
              </>
            )}
          </>
        ) : (
          <Flex justifyContent="center" alignItems="center" height="100%">
            <Typography>
              <Trans>No price chart available for this pair.</Trans>
            </Typography>
          </Flex>
        )}
      </ChartContainer>

      <Modal isOpen={tradingViewActive} onDismiss={handleTVDismiss} fullscreen>
        {tradingViewActive && (
          <TVChartContainerWrap>
            <TVChartContainer
              interval={chartOption.period as ResolutionString}
              symbol={symbolName.replaceAll(' ', '')}
              setActiveSymbol={setActiveSymbol}
            />
          </TVChartContainerWrap>
        )}
      </Modal>
    </Box>
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

const ChartControlButton = styled(Button)<{ active: boolean }>`
  padding: 1px 12px;
  border-radius: 100px;
  color: #ffffff;
  font-size: 14px;
  background-color: ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.bg3)};
  transition: background-color 0.3s ease;

  :hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 1px 12px;
  `}
`;

const ChartControlGroup = styled(Box)`
  text-align: left;

  ${({ theme }) => theme.mediaWidth.upSmall`
    text-align: right;
  `}

  & button {
    margin-right: 5px;
  }

  & button:last-child {
    margin-right: 0;
  }
`;

const ChartContainer = styled(Box)`
  position: relative;
  height: ${HEIGHT}px;
`;
