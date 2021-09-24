import React from 'react';

import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Spinner from 'app/components/Spinner';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import { getTradePair } from 'constants/currency';
import useWidth from 'hooks/useWidth';
import { usePriceChartDataQuery } from 'queries/swap';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo } from 'store/swap/hooks';

export default function SwapDescription() {
  const { currencies } = useDerivedSwapInfo();

  const [chartOption, setChartOption] = React.useState<{ type: CHART_TYPES; period: CHART_PERIODS }>({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['1H'],
  });

  const [ref, width] = useWidth();

  const priceChartQuery = usePriceChartDataQuery(currencies, chartOption.period);
  const data = priceChartQuery.data;
  const loading = priceChartQuery.isLoading;

  const [pair] = getTradePair(currencies[Field.INPUT]?.symbol as string, currencies[Field.OUTPUT]?.symbol as string);

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

  return (
    <Box bg="bg2" flex={1} p={[5, 7]}>
      <Flex mb={5} flexWrap="wrap">
        <Box width={[1, 1 / 2]}>
          <Typography variant="h3" mb={2}>
            {currencies[Field.INPUT]?.symbol} / {currencies[Field.OUTPUT]?.symbol}
          </Typography>
        </Box>
        <Box width={[1, 1 / 2]} marginTop={[3, 0]} hidden={!pair}>
          <ChartControlGroup mb={2}>
            {Object.keys(CHART_PERIODS).map(key => (
              <ChartControlButton
                key={key}
                type="button"
                value={CHART_PERIODS[key]}
                onClick={handleChartPeriodChange}
                active={chartOption.period === CHART_PERIODS[key]}
              >
                {CHART_PERIODS[key]}
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
                {CHART_TYPES[key]}
              </ChartControlButton>
            ))}
          </ChartControlGroup>
        </Box>
      </Flex>

      <ChartContainer ref={ref}>
        {pair ? (
          <>
            {loading ? (
              <Spinner size={'lg'} centered />
            ) : (
              <>
                {chartOption.type === CHART_TYPES.AREA && (
                  <TradingViewChart data={data} volumeData={data} width={width} type={CHART_TYPES.AREA} />
                )}

                {chartOption.type === CHART_TYPES.CANDLE && (
                  <TradingViewChart data={data} volumeData={data} width={width} type={CHART_TYPES.CANDLE} />
                )}
              </>
            )}
          </>
        ) : (
          <Flex justifyContent="center" alignItems="center" height="100%">
            <Typography>No price chart available for this pair.</Typography>
          </Flex>
        )}
      </ChartContainer>
    </Box>
  );
}

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
