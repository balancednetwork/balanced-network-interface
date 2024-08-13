import React from 'react';

import { Box, Flex } from 'rebass/styled-components';

import { BoxPanel } from '@/components/Panel';

import RewardsOverview from './RewardsOverview';
import DepositChart from './DepositChart';
import { useMedia } from 'react-use';

export default function BSRSection() {
  const isSmall = useMedia('(max-width: 1199px)');

  return (
    <BoxPanel bg="bg2" id="savings-rate">
      <Flex flexWrap="wrap">
        <Box
          width={isSmall ? '100%' : '50%'}
          className={isSmall ? '' : 'border-right'}
          p={isSmall ? '0' : '0 35px 0 0'}
        >
          <RewardsOverview />
        </Box>
        <Box width={isSmall ? '100%' : '50%'} p={isSmall ? '35px 0 0 0' : '0 0 0 35px'}>
          <DepositChart />
        </Box>
      </Flex>
    </BoxPanel>
  );
}
