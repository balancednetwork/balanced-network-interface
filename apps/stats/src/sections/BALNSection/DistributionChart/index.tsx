import React from 'react';

import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import styled, { css, useTheme } from 'styled-components';

import { StyledTooltipContainer } from '@/components/MultiLineChart';
import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { Typography } from '@/theme';

import { useBALNDistributionQuery, useBALNTotalSupply, useEmissions } from '../queries';

export const INNER_RADIUS = 65;
export const INNER_RADIUS_MOBILE = 55;
export const OUTER_RADIUS = 115;
export const OUTER_RADIUS_MOBILE = 105;
export const PIE_CHART_HEIGHT = 330;

export const ChartSection = styled(Box)<{ border?: boolean }>`
  width: 100%;
  ${({ border }) => border && `margin-bottom: 35px !important;`}

  @media all and (min-width: 1200px) {
    width: 50%;
    position: relative;

    ${({ border, theme }) =>
      border
        ? css`
            margin-bottom: 0 !important;
            padding-right: 35px;
            &:before {
              content: '';
              position: absolute;
              top: 10px;
              right: 0;
              width: 1px;
              height: calc(100% - 20px);
              background-color: ${theme.colors.divider};
            }
          `
        : css`
            padding-left: 35px;
          `};
  }

  @media all and (min-width: 1280px) {
    width: 50%;
  }
`;

export const ChartWrap = styled.div<{ visibleOverflow?: boolean }>`
  margin-bottom: 20px;
  height: ${PIE_CHART_HEIGHT}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  svg {
    ${({ visibleOverflow }) => visibleOverflow && 'overflow: visible !important'};
  }
`;
export const ChartInfo = styled(Flex)`
  flex-flow: column;
  ${({ theme }) => css`
    background-color: ${theme.colors.bg3};
    padding: 5px 20px;
    border-radius: 10px;
  `};

  @media all and (min-width: 500px) {
    flex-flow: row;
    flex-wrap: wrap;
  }
`;

export const ChartInfoItem = styled(Flex)<{ border?: boolean; smaller?: boolean }>`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 15px 0;
  width: 100%;

  @media all and (min-width: 500px) {
    width: 50%;
  }

  @media all and (min-width: 700px) {
    ${({ smaller }) => smaller && 'width: 33.3333%;'};
  }

  ${({ border }) =>
    border &&
    css`
      &:before {
        content: '';
        position: absolute;
        top: 100%;
        right: 15px;
        width: calc(100% - 30px);
        height: 1px;
        background-color: ${({ theme }) => theme.colors.divider};

        @media all and (min-width: 500px) {
          top: 19px;
          right: 0;
          height: calc(100% - 38px);
          width: 1px;
        }
      }
    `};
`;

export const LegendItem = styled.div<{ legendColor: string }>`
  display: flex;
  margin-right: 15px;
  margin-bottom: 5px;
  font-size: 14px;
  position: relative;
  padding-left: 12px;

  &:before {
    content: '';
    position: absolute;
    top: 4px;
    left: 0;
    width: 5px;
    height: 13px;
    border-radius: 5px;
    background-color: ${({ legendColor }) => legendColor};
  }
`;

export const CustomLabel = props => {
  const theme = useTheme();
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, outerRadius, payload, percent } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 0) * cos;
  const sy = cy + (outerRadius + 0) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
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
      >{`${payload.name}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey + 10}
        dy={18}
        textAnchor={textAnchor}
        fontSize={14}
        fill={theme.colors.text1}
      >
        {`${parseFloat((percent * 100).toFixed(2)).toPrecision()}%`}
      </text>
    </g>
  );
};

export const CustomLegend = props => {
  return (
    <Flex mt={3} flexWrap="wrap" alignItems="center" justifyContent="center">
      {props.payload.map((entry, index) => {
        const { fill } = entry.payload;

        return (
          <LegendItem key={`item-${index}`} legendColor={fill}>
            <span style={{ backgroundColor: entry.color }} />
            {entry.value?.replace('/', ' / ')}
          </LegendItem>
        );
      })}
    </Flex>
  );
};

export const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <StyledTooltipContainer>
        <Flex mb="-5px">
          <LegendItem legendColor={payload[0].payload.fill}>{payload[0].payload.name}</LegendItem>
          <Typography ml="-8px" color="text1" fontSize={14}>
            {parseFloat((payload[0].value * 100).toFixed(2)).toPrecision()}%
          </Typography>
        </Flex>
      </StyledTooltipContainer>
    );
  } else {
    return null;
  }
};

export default function DistributionChart() {
  const { data } = useBALNDistributionQuery();
  const { data: emissions } = useEmissions();
  const { data: totalSupply } = useBALNTotalSupply();
  const isSmallScreen = useMedia('(max-width: 620px)');

  return (
    <ChartSection border>
      <Typography variant="h3">BALN distribution</Typography>
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
                fill="#136aa1"
                startAngle={-270}
              />
              {isSmallScreen && (
                <>
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" content={<CustomLegend />} />
                  {/*@ts-ignore */}
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
            {emissions ? emissions.toFormat(0) : <LoaderComponent />}
            {' BALN'}
          </Typography>
          <Typography fontSize={14} color="text1">
            Today's distribution
          </Typography>
        </ChartInfoItem>
        <ChartInfoItem>
          <Typography fontSize={18} color="text">
            {totalSupply ? totalSupply.toFormat(0) : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            Total BALN
          </Typography>
        </ChartInfoItem>
      </ChartInfo>
    </ChartSection>
  );
}
