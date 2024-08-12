import React, { useCallback, useState } from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { predefinedCollateralTypes } from '@/components/CollateralSelector/CollateralTypeList';
import { DEFAULT_HEIGHT } from '@/components/LineChart';
import { BoxPanel } from '@/components/Panel';
import { ChartsWrap } from '@/sections/BALNSection';
import { Typography } from '@/theme';

import BnUSDChart from './BnUSDChart';
import CollateralChart from './CollateralChart';
import TimeFrameSelector, { TimeFrame } from './TimeFrameSelector';

export const ChartPanel = styled(BoxPanel)`
  width: 100%;
`;

export const ChartContainer = styled(Box)`
  position: relative;
  height: ${DEFAULT_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function CollateralAndLoanSection() {
  const [selectedCollateral, setSelectedCollateral] = useState<string>(predefinedCollateralTypes.ALL);

  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('YEAR');

  return (
    <BoxPanel bg="bg2">
      <Flex alignItems={['start', 'center']} flexDirection={['column', 'row']}>
        <Typography variant="h2" mb={[1, 5]} mr={2}>
          Stablecoin
        </Typography>
        <Box mb="15px">
          <TimeFrameSelector selected={selectedTimeFrame} setSelected={setSelectedTimeFrame} />
        </Box>
      </Flex>
      <ChartsWrap>
        <CollateralChart
          selectedCollateral={selectedCollateral}
          setCollateral={setSelectedCollateral}
          selectedTimeFrame={selectedTimeFrame}
        />
        <BnUSDChart selectedCollateral={selectedCollateral} selectedTimeFrame={selectedTimeFrame} />
      </ChartsWrap>
    </BoxPanel>
  );
}
