import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { useNetworkOwnedLiquidityData, usePastMonthSupply } from '@/queries/nol';
import {
  ChartInfo,
  ChartInfoItem,
  ChartWrap,
  CustomLegend,
  INNER_RADIUS,
  INNER_RADIUS_MOBILE,
  OUTER_RADIUS,
  OUTER_RADIUS_MOBILE,
} from '@/sections/BALNSection/DistributionChart';
import { CustomLabel, CustomTooltip } from '@/sections/HoldingsOverviewSection/TokensChart';
import { Typography } from '@/theme';
import React from 'react';
import { useMedia } from 'react-use';
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const NetworkOwnedLiquidity = () => {
  const { data: nolData } = useNetworkOwnedLiquidityData();
  const { data: pastMonthSupply } = usePastMonthSupply();
  const isSmallScreen = useMedia('(max-width: 620px)');

  return (
    <>
      <Typography variant="h3" mb="25px">
        Network-owned liquidity
      </Typography>

      <ChartWrap visibleOverflow>
        {nolData?.chartData && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={nolData?.chartData}
                stroke={'0'}
                cx="50%"
                cy="50%"
                innerRadius={isSmallScreen ? INNER_RADIUS_MOBILE : INNER_RADIUS}
                outerRadius={isSmallScreen ? OUTER_RADIUS_MOBILE : OUTER_RADIUS}
                label={!isSmallScreen && <CustomLabel />}
                labelLine={false}
                fill="#136aa1"
                startAngle={-265}
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

      <ChartInfo mt="25px">
        <ChartInfoItem border>
          <Typography fontSize={18} color="text">
            {nolData ? `$${nolData.tvl.toFormat(0)}` : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            Total value
          </Typography>
        </ChartInfoItem>
        <ChartInfoItem>
          <Typography fontSize={18} color="text">
            {pastMonthSupply ? `$${pastMonthSupply.toFormat(0)}` : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            Supplied past month
          </Typography>
        </ChartInfoItem>
      </ChartInfo>
    </>
  );
};

export default NetworkOwnedLiquidity;
