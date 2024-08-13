import React, { useMemo } from 'react';

import { useMedia } from 'react-use';
import { Flex } from 'rebass';
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
  OUTER_RADIUS,
  OUTER_RADIUS_MOBILE,
} from '@/sections/BALNSection/DistributionChart';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';

import { useDAOFundPOLPieData, useDAOFundTotal } from '../queries';
import { CustomLabel, CustomTooltip } from '../TokensChart';

export default function POLChart() {
  const { data } = useDAOFundPOLPieData();
  const now = useTimestampRounded();
  const before = useTimestampRounded(1000 * 60, 30);
  const daoFundNow = useDAOFundTotal(now);
  const daoFundBefore = useDAOFundTotal(before);
  const isSmallScreen = useMedia('(max-width: 620px)');

  const isDiffPositive = useMemo(() => {
    if (daoFundBefore && daoFundNow) {
      const diff = daoFundNow.POLHoldings - daoFundBefore.POLHoldings;
      return diff > 0;
    }
  }, [daoFundBefore, daoFundNow]);

  const fundDiff = useMemo(() => {
    if (daoFundBefore && daoFundNow) {
      return Math.abs(daoFundNow.POLHoldings - daoFundBefore.POLHoldings);
    }
  }, [daoFundBefore, daoFundNow]);

  return (
    <ChartSection border>
      <Flex alignItems="center" flexWrap="wrap">
        <Typography variant="h3" mr={2}>
          Protocol-owned liquidity
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
            {daoFundNow ? `$${getFormattedNumber(daoFundNow.POLHoldings, 'number')}` : <LoaderComponent />}
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
