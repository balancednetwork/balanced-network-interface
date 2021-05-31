import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Spinner from 'app/components/Spinner';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { formatBigNumber } from 'utils';

export default function SwapDescription() {
  const { currencyKeys, price } = useDerivedSwapInfo();

  const [chartOption, setChartOption] = React.useState({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['5m'],
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

  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const loadChartData = React.useCallback(
    ({ interval, inputSymbol, outputSymbol }: { interval: string; inputSymbol: string; outputSymbol: string }) => {
      setLoading(true);
      try {
        axios
          .get(
            `https://balanced.techiast.com:8069/api/v1/chart/lines?symbol=${
              inputSymbol === 'bnusd' || inputSymbol === 'icx' ? outputSymbol + inputSymbol : inputSymbol + outputSymbol
            }&interval=${interval}&limit=500&order=desc`,
          )
          .then(res => {
            const { data: d } = res;
            let t = d.map(item => ({
              time: item.time,
              value:
                inputSymbol === 'bnusd' || inputSymbol === 'icx'
                  ? 1 / BalancedJs.utils.toIcx(new BigNumber(item.price)).toNumber()
                  : BalancedJs.utils.toIcx(new BigNumber(item.price)).toNumber(),
            }));

            if (!t.length) {
              console.log('No chart data, switch to others trading pairs');
              return;
            }
            setData(t);
            setLoading(false);
          });
      } catch (e) {
        console.error(e);
        setData([]);
        setLoading(false);
      }
    },
    [],
  );

  const handleChartPeriodChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const interval: string = event.currentTarget.value;
    loadChartData({
      inputSymbol: currencyKeys[Field.INPUT]?.toLowerCase() || '',
      outputSymbol: currencyKeys[Field.OUTPUT]?.toLowerCase() || '',
      interval: interval.toLowerCase(),
    });
    setChartOption({
      ...chartOption,
      period: interval,
    });
  };

  const handleChartTypeChange = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setChartOption({
      ...chartOption,
      type: event.currentTarget.value,
    });
  };

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
        </Box>
        <Box width={[1, 1 / 2]} marginTop={[3, 0]} style={{ display: 'none' }}>
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
            <ChartControlButton
              key={CHART_TYPES.AREA}
              type="button"
              value={CHART_TYPES.AREA}
              onClick={handleChartTypeChange}
              active={chartOption.type === CHART_TYPES.AREA}
            >
              {CHART_TYPES.AREA}
            </ChartControlButton>
          </ChartControlGroup>
        </Box>
      </Flex>
      <Flex
        alignItems="center"
        justifyContent="center"
        mt={3}
        style={{ height: 'calc(100% - 60px)', marginTop: '0px' }}
      >
        Chart coming soon.
      </Flex>
      {chartOption.type === CHART_TYPES.AREA && (
        <ChartContainer ref={ref} style={{ display: 'none' }}>
          {loading ? <Spinner centered /> : <TradingViewChart data={data} width={width} type={CHART_TYPES.AREA} />}
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
