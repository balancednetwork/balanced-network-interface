import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { useSavingsRateInfo } from '@/queries/bsr';
import { ChartInfo, ChartInfoItem } from '@/sections/BALNSection/DistributionChart';
import { Typography } from '@/theme';
import React from 'react';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

const Wrap = styled(Box)``;

const RewardsOverview = () => {
  const { data: savingsRate } = useSavingsRateInfo();

  console.log('savingsRate', savingsRate);

  return (
    <Wrap>
      <Flex alignItems="center" mb="25px">
        <Typography variant="h2" mr="7px">
          Savings rate
        </Typography>
        <Typography pt="8px">{savingsRate && `${savingsRate.APR.toFormat(2)}% APR`}</Typography>
      </Flex>

      <ChartInfo>
        <ChartInfoItem border>
          <Typography fontSize={18} color="text">
            {savingsRate ? `$${savingsRate.dailyPayout.times(30).toFormat(0)}` : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            Rewards this month
          </Typography>
        </ChartInfoItem>
        <ChartInfoItem>
          <Typography fontSize={18} color="text">
            {savingsRate ? `$${savingsRate.monthlyRewards.toFormat(0)}` : <LoaderComponent />}
          </Typography>
          <Typography fontSize={14} color="text1">
            Distributed past month
          </Typography>
        </ChartInfoItem>
      </ChartInfo>
    </Wrap>
  );
};

export default RewardsOverview;
