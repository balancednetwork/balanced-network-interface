import Spinner from '@/components/Spinner';
import dayjs from 'dayjs';
import { useDepositsChartData, useSavingsRateInfo } from '@/queries/bsr';
import React from 'react';
import { Box, Flex } from 'rebass';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TooltipWrapper } from '@/sections/EnshrinmentSection/ICXBurn';
import styled, { useTheme } from 'styled-components';
import { Typography } from '@/theme';
import { formatYAxisNumber, getFormattedNumber } from '@/utils/formatter';

const Wrap = styled(Box)`
  margin-bottom: -10px !important;
`;

const DEFAULT_HEIGHT = 125;

const ChartWrapper = styled(Box)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;
  padding: 0;
  display: flex;
  background-color: transparent;
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`;

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { timestamp, value } = payload[0].payload;
    return (
      <TooltipWrapper>
        <Box>
          <Typography color="text" fontSize={14} mb={1}>
            {dayjs(timestamp).format('DD MMM YYYY')}
          </Typography>
          <Typography color="text1" fontSize={14}>
            <strong>{getFormattedNumber(value, 'number')}</strong> bnUSD
          </Typography>
        </Box>
      </TooltipWrapper>
    );
  }

  return null;
};

const DepositChart = () => {
  const { data: savingsRate } = useSavingsRateInfo();
  const { data: depositsChartData } = useDepositsChartData();
  const theme = useTheme();

  const tickCount = 4;
  const ticks: number[] = React.useMemo(() => {
    if (!depositsChartData) return [];
    const interval = Math.floor(depositsChartData.length / (tickCount - 1));
    const pickedItems = Array.from({ length: tickCount }, (_, i) => depositsChartData[i * interval]);
    return pickedItems.map(item => item.timestamp);
  }, [depositsChartData]);

  return (
    <Wrap>
      <Flex alignItems="center" flexWrap="wrap" pr="40px" pt="3px">
        <Typography variant="h3" mr="7px">
          Amount deposited
        </Typography>
        <Typography pt="5px">
          {savingsRate && `${savingsRate.totalLocked.toFixed(0, { groupSeparator: ',' })} bnUSD`}
        </Typography>
      </Flex>

      <ChartWrapper>
        {depositsChartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              width={200}
              height={DEFAULT_HEIGHT}
              data={depositsChartData}
              margin={{
                top: 5,
                right: 35,
                left: 23,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id={`gradientSavings`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.colors.primary} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tick={{ stroke: theme.colors.text1, fontSize: '14px' }}
                tickFormatter={time => dayjs(time).format('MMM DD')}
                ticks={ticks}
                interval={0}
              />
              <YAxis
                dataKey="value"
                axisLine={false}
                tickLine={false}
                orientation="right"
                tick={{ stroke: theme.colors.text1, fontSize: '14px' }}
                tickFormatter={value => formatYAxisNumber(value, value > 100 ? 1 : 2)}
                width={5}
                domain={[`auto`, 'auto']}
                padding={{ top: 10, bottom: 10 }}
                tickCount={1}
              />

              <Tooltip
                cursor={false}
                // @ts-ignore
                content={<CustomTooltip />}
                allowEscapeViewBox={{ x: true, y: true }}
              />

              <Area
                dataKey="value"
                type="monotone"
                stroke={theme.colors.primary}
                fill={`url(#gradientSavings)`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Box width={1} style={{ position: 'relative', paddingTop: `${DEFAULT_HEIGHT}px` }}>
            <Spinner centered size={35} />
          </Box>
        )}
      </ChartWrapper>
    </Wrap>
  );
};

export default DepositChart;
