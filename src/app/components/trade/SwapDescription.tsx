import React from 'react';

import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Spinner from 'app/components/Spinner';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import { getTradePair, isQueue } from 'constants/currency';
import { usePriceChartDataQuery } from 'queries/swap';
import { useRatio } from 'store/ratio/hooks';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { formatBigNumber, generateChartData } from 'utils';

export default function SwapDescription() {
  const { currencyKeys, price } = useDerivedSwapInfo();

  const [chartOption, setChartOption] = React.useState<{ type: CHART_TYPES; period: CHART_PERIODS }>({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['1H'],
  });

  // update the width on a window resize
  const ref = React.useRef<HTMLDivElement>();
  const [width, setWidth] = React.useState(ref?.current?.clientWidth);
  React.useEffect(() => {
    function handleResize() {
      setWidth(ref?.current?.clientWidth ?? width);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  const priceChartQuery = usePriceChartDataQuery(currencyKeys, chartOption.period);
  const data = priceChartQuery.data;
  const loading = priceChartQuery.isLoading;

  const ratio = useRatio();
  const data1: any = React.useMemo(() => generateChartData(ratio.sICXICXratio, currencyKeys), [
    ratio.sICXICXratio,
    currencyKeys,
  ]);

  const iCXprice =
    price &&
    (currencyKeys[Field.OUTPUT] === 'sICX'
      ? price.value.div(ratio.sICXICXratio)
      : ratio.sICXICXratio.multipliedBy(price.value));

  const [pair] = getTradePair(currencyKeys[Field.INPUT] as string, currencyKeys[Field.OUTPUT] as string);

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

  const hasSicx = [currencyKeys[Field.INPUT], currencyKeys[Field.OUTPUT]].includes('sICX');
  const hasICX = [currencyKeys[Field.INPUT], currencyKeys[Field.OUTPUT]].includes('ICX');

  return (
    <Box bg="bg2" flex={1} p={[5, 7]}>
      <Flex mb={5} flexWrap="wrap">
        <Box width={[1, 1 / 2]}>
          <Typography variant="h3" mb={2}>
            {currencyKeys[Field.INPUT]} / {currencyKeys[Field.OUTPUT]}
          </Typography>
          <Typography variant="p">
            {`${formatBigNumber(price?.value, 'price')} ${currencyKeys[Field.OUTPUT]} 
                per ${currencyKeys[Field.INPUT]} `}
            <span className="alert" style={{ display: 'none' }}>
              -1.21%
            </span>
          </Typography>
          {hasSicx && !hasICX && (
            <Typography variant="p" fontSize="14px" color="rgba(255,255,255,0.75)">
              {`${formatBigNumber(iCXprice, 'price')} ${
                currencyKeys[Field.OUTPUT] === 'sICX' ? 'ICX' : currencyKeys[Field.OUTPUT]
              } 
               per ${currencyKeys[Field.INPUT] === 'sICX' ? 'ICX' : currencyKeys[Field.INPUT]} `}
              <span className="alert" style={{ display: 'none' }}>
                -1.21%
              </span>
            </Typography>
          )}
        </Box>
        <Box width={[1, 1 / 2]} marginTop={[3, 0]} hidden={pair && isQueue(pair)}>
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

      {chartOption.type === CHART_TYPES.AREA && (
        <ChartContainer ref={ref}>
          {loading ? (
            <Spinner size={'lg'} centered />
          ) : (
            <TradingViewChart
              data={pair && !isQueue(pair) ? data : data1}
              volumeData={pair && !isQueue(pair) ? data : data1}
              width={width}
              type={CHART_TYPES.AREA}
            />
          )}
        </ChartContainer>
      )}

      {chartOption.type === CHART_TYPES.CANDLE && (
        <ChartContainer ref={ref}>
          {loading ? (
            <Spinner size={'lg'} centered />
          ) : (
            <TradingViewChart
              data={pair && !isQueue(pair) ? data : data1}
              volumeData={pair && !isQueue(pair) ? data : data1}
              width={width}
              type={CHART_TYPES.CANDLE}
            />
          )}
        </ChartContainer>
      )}
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
