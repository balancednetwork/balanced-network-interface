import React, { useMemo } from 'react';

import { useMedia } from 'react-use';
import { Flex } from 'rebass';
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from 'styled-components';

import { StyledTooltipContainer } from '@/components/MultiLineChart';
import useTimestampRounded from '@/hooks/useTimestampRounded';
import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import {
  ChartInfo,
  ChartInfoItem,
  ChartSection,
  ChartWrap,
  CustomLegend,
  INNER_RADIUS,
  INNER_RADIUS_MOBILE,
  LegendItem,
  OUTER_RADIUS,
  OUTER_RADIUS_MOBILE,
} from '@/sections/BALNSection/DistributionChart';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';

import { useDAOFundHoldingsPieData, useDAOFundTotal } from '../queries';

export const CustomLabel = props => {
  const theme = useTheme();
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, outerRadius, payload, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 0) * cos;
  const sy = cy + (outerRadius + 0) * sin;
  const mx = cx + (outerRadius + 25) * cos;
  const my = cy + (outerRadius + 25) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 14;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={'#7B8696'} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={'#7B8696'} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey + 6}
        textAnchor={textAnchor}
        fill="#FFF"
        fontSize={16}
      >{`${payload.name?.replace('/', ' / ')}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey + 10}
        dy={18}
        textAnchor={textAnchor}
        fontSize={14}
        fill={theme.colors.text1}
      >
        {`$${getFormattedNumber(value, 'number')}`}
      </text>
    </g>
  );
};

export const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <StyledTooltipContainer>
        <Flex mb="-5px" flexWrap="wrap">
          <LegendItem legendColor={payload[0].payload.fill}>{`${payload[0].payload.name?.replace(
            '/',
            ' / ',
          )}`}</LegendItem>
          <Typography ml="-8px" color="text1" fontSize={14} pl="5px">
            {`$${getFormattedNumber(payload[0].payload.value, 'number')}`}
          </Typography>
        </Flex>
      </StyledTooltipContainer>
    );
  } else {
    return null;
  }
};

export default function TokensChart() {
  const { data } = useDAOFundHoldingsPieData();
  const now = useTimestampRounded();
  const before = useTimestampRounded(1000 * 60, 30);
  const daoFundNow = useDAOFundTotal(now);
  const daoFundBefore = useDAOFundTotal(before);
  const isSmallScreen = useMedia('(max-width: 620px)');

  const isDiffPositive = useMemo(() => {
    if (daoFundBefore && daoFundNow) {
      const diff = daoFundNow.holdings - daoFundBefore.holdings;
      return diff > 0;
    }
  }, [daoFundBefore, daoFundNow]);

  const fundDiff = useMemo(() => {
    if (daoFundBefore && daoFundNow) {
      return Math.abs(daoFundNow.holdings - daoFundBefore.holdings);
    }
  }, [daoFundBefore, daoFundNow]);

  return (
    <ChartSection>
      <Flex alignItems="center" flexWrap="wrap">
        <Typography variant="h3" mr={2}>
          DAO Fund
        </Typography>
      </Flex>
      <ChartWrap visibleOverflow>
        {data && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={data}
                stroke={'0'}
                cx="50%"
                cy="50%"
                innerRadius={isSmallScreen ? INNER_RADIUS_MOBILE : INNER_RADIUS}
                outerRadius={isSmallScreen ? OUTER_RADIUS_MOBILE : OUTER_RADIUS}
                label={!isSmallScreen && <CustomLabel />}
                labelLine={false}
                fill="#334764"
                startAngle={-270}
              />
              {isSmallScreen && (
                <>
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" content={<CustomLegend />} />
                  {/* @ts-ignore */}
                  <Tooltip content={<CustomTooltip />} />
                </>
              )}
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartWrap>

      <ChartInfo>
        <ChartInfoItem border>
          <Typography fontSize={18} color="text">
            {daoFundNow ? `$${getFormattedNumber(daoFundNow.holdings, 'number')}` : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            Total value
          </Typography>
        </ChartInfoItem>
        <ChartInfoItem>
          <Typography fontSize={18} color="text">
            {fundDiff ? (
              `${isDiffPositive ? '+ ' : '- '}$${getFormattedNumber(fundDiff, 'number')}`
            ) : (
              <LoaderComponent />
            )}
          </Typography>
          <Typography fontSize={14} color="text1">
            Past month
          </Typography>
        </ChartInfoItem>
      </ChartInfo>
    </ChartSection>
  );
}
