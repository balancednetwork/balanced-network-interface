import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { BalancedJs } from 'packages/BalancedJs';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Spinner from 'app/components/Spinner';
import TradingViewChart, { CHART_TYPES, CHART_PERIODS, HEIGHT } from 'app/components/TradingViewChart';
import { Typography } from 'app/theme';
import { getTradePair, isQueue } from 'constants/currency';
import { ONE } from 'constants/index';
import { useRatio } from 'store/ratio/hooks';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { CurrencyKey } from 'types';
import { formatBigNumber, sleep } from 'utils';

const API_ENDPOINT = process.env.NODE_ENV === 'production' ? 'https://balanced.geometry.io/api/v1' : '/api/v1';
const LAUNCH_DAY = 1619398800000000;
const ONE_DAY_DURATION = 86400000;

const generateChartData = (rate: BigNumber, currencyKeys: { [field in Field]?: CurrencyKey }) => {
  const today = dayjs().startOf('day');
  const launchDay = dayjs(LAUNCH_DAY / 1000).startOf('day');
  const platformDays = (today.valueOf() - launchDay.valueOf()) / ONE_DAY_DURATION + 1;
  const stop = BalancedJs.utils.toLoop(rate);
  const start = BalancedJs.utils.toLoop(ONE);
  const step = stop.minus(start).div(platformDays - 1);

  let _data;

  if (currencyKeys[Field.INPUT] === 'sICX' && currencyKeys[Field.OUTPUT] === 'ICX') {
    _data = Array(platformDays)
      .fill(start)
      .map((x, index) => ({
        time: launchDay.add(index, 'day').valueOf() / 1_000,
        value: BalancedJs.utils.toIcx(x.plus(step.times(index))).toNumber(),
      }));
  } else {
    _data = Array(platformDays)
      .fill(start)
      .map((x, index) => ({
        time: launchDay.add(index, 'day').valueOf() / 1_000,
        value: ONE.div(BalancedJs.utils.toIcx(x.plus(step.times(index)))).toNumber(),
      }));
  }

  return _data;
};

export default function SwapDescription() {
  const { currencyKeys, price } = useDerivedSwapInfo();

  const [chartOption, setChartOption] = React.useState<{ type: CHART_TYPES; period: CHART_PERIODS }>({
    type: CHART_TYPES.AREA,
    period: CHART_PERIODS['1D'],
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

  const [data, setData] = React.useState<
    { time: number; open: number; close: number; high: number; low: number; volume: number }[]
  >([]);
  const [loading, setLoading] = React.useState(false);

  const ratio = useRatio();
  React.useEffect(() => {
    const [pair, inverse] = getTradePair(currencyKeys[Field.INPUT] as string, currencyKeys[Field.OUTPUT] as string);

    const fetchData = async () => {
      setLoading(true);
      try {
        const day = new Date().valueOf() * 1_000;
        const {
          data: result,
        }: {
          data: { time: number; open: number; close: number; high: number; low: number; volume: number }[];
        } = await axios.get(
          `${API_ENDPOINT}/dex/swap-chart/${pair?.poolId}/${chartOption.period.toLowerCase()}/${LAUNCH_DAY}/${day}`,
        );

        let data1;

        if (!inverse) {
          data1 = result.map(item => ({
            time: item.time / 1_000_000,
            value: BalancedJs.utils.toIcx(item.open).toNumber(),
            open: BalancedJs.utils.toIcx(item.open).toNumber(),
            close: BalancedJs.utils.toIcx(item.close).toNumber(),
            high: BalancedJs.utils.toIcx(item.high).toNumber(),
            low: BalancedJs.utils.toIcx(item.low).toNumber(),
            volume: BalancedJs.utils.toIcx(item.volume).toNumber(),
          }));
        } else {
          data1 = result.map(item => ({
            time: item.time / 1_000_000,
            value: ONE.div(BalancedJs.utils.toIcx(item.open)).toNumber(),
            open: ONE.div(BalancedJs.utils.toIcx(item.open)).toNumber(),
            close: ONE.div(BalancedJs.utils.toIcx(item.close)).toNumber(),
            high: ONE.div(BalancedJs.utils.toIcx(item.high)).toNumber(),
            low: ONE.div(BalancedJs.utils.toIcx(item.low)).toNumber(),
            volume: BalancedJs.utils.toIcx(item.volume).toNumber(),
          }));
        }

        setData(data1);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setData([]);
        setLoading(false);
      }
    };

    const generateData = async () => {
      setLoading(true);
      await sleep(100);
      const _data: any = generateChartData(ratio.sICXICXratio, currencyKeys);
      setChartOption(options => ({ ...options, type: CHART_TYPES.AREA }));
      setData(_data);
      setLoading(false);
    };

    if (pair) {
      if (isQueue(pair)) {
        generateData();
      } else {
        fetchData();
      }
    }
  }, [currencyKeys, chartOption.period, ratio.sICXICXratio]);

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
            <Spinner centered />
          ) : (
            <TradingViewChart data={data} volumeData={data} width={width} type={CHART_TYPES.AREA} />
          )}
        </ChartContainer>
      )}

      {chartOption.type === CHART_TYPES.CANDLE && (
        <ChartContainer ref={ref}>
          {loading ? (
            <Spinner centered />
          ) : (
            <TradingViewChart data={data} volumeData={data} width={width} type={CHART_TYPES.CANDLE} />
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
