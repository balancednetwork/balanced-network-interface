import React from 'react';

import { useOverviewInfo } from '@/queries';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from 'styled-components';

import QuestionIcon from '@/assets/icons/question.svg';
import { StyledTooltipContainer } from '@/components/MultiLineChart';
import { MouseoverTooltip } from '@/components/Tooltip';
import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';

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
} from '../DistributionChart';
import { useAverageLockUpTime, useBALNRatioData, useBBALNHolders } from '../queries';

const CustomLabel = props => {
  const theme = useTheme();
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, outerRadius, payload, value } = props;
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
        {`${(value / 1000000).toFixed(1)}M BALN`}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <StyledTooltipContainer>
        <Flex mb="-5px">
          <LegendItem legendColor={payload[0].payload.fill}>{payload[0].payload.name}</LegendItem>
          <Typography ml="-8px" color="text1" fontSize={14}>
            {`${(payload[0].value / 1000000).toFixed(1)}M BALN`}
          </Typography>
        </Flex>
      </StyledTooltipContainer>
    );
  } else {
    return null;
  }
};

export default function BBALNChart() {
  const { data: bbalnHolders } = useBBALNHolders();
  const { data: averageLockUp } = useAverageLockUpTime();
  const { data } = useBALNRatioData();
  const overviewInfo = useOverviewInfo();
  const isSmallScreen = useMedia('(max-width: 620px)');

  return (
    <ChartSection>
      <Flex alignItems="center" flexWrap="wrap">
        <Typography variant="h3" mr={2}>
          Boosted BALN
        </Typography>
        <Typography color="text1" sx={{ transform: 'translateY(2px)' }} fontSize={16}>
          {overviewInfo &&
            overviewInfo.bBALNAPY &&
            `${getFormattedNumber(overviewInfo.bBALNAPY.toNumber(), 'percent2')} APR`}
        </Typography>
        <Box margin="1px 0 0 7px">
          {overviewInfo.monthlyFeesTotal ? (
            <MouseoverTooltip
              width={300}
              text={
                <>
                  <Typography>
                    Calculated from the network fees distributed to bBALN holders over the last 30 days (
                    <strong>${overviewInfo.monthlyFeesTotal.toFormat(0)}</strong>). Assumes the price of 1 bBALN is
                    equivalent to 1 BALN locked for 4 years
                    {overviewInfo.balnPrice ? <strong>{` ($${overviewInfo.balnPrice.toFormat(2)})`}</strong> : ''}.
                  </Typography>
                  {overviewInfo.previousChunk && (
                    <Typography mt={2}>
                      Over the past month, {getFormattedNumber(overviewInfo.previousChunkAmount, 'number')} bBALN would
                      have received <strong>${overviewInfo.previousChunk.toPrecision(3)}</strong>.
                    </Typography>
                  )}
                </>
              }
              placement="top"
            >
              <QuestionIcon width={14} />
            </MouseoverTooltip>
          ) : null}
        </Box>
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
                fill="#136aa1"
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
            {bbalnHolders ? bbalnHolders.toFormat(0) : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            bBALN holders
          </Typography>
        </ChartInfoItem>
        <ChartInfoItem>
          <Typography fontSize={18} color="text">
            {averageLockUp ? `${averageLockUp.toFormat(2)} years` : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            Average lock-up time
          </Typography>
        </ChartInfoItem>
      </ChartInfo>
    </ChartSection>
  );
}
