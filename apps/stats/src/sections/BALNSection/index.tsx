import React from 'react';

import { useAllTokensByAddress } from '@/queries/backendv2';
import { Flex } from 'rebass';
import styled from 'styled-components';

import bnJs from '@/bnJs';
import { BoxPanel } from '@/components/Panel';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';

import BBALNChart from './BBALNChart';
import DistributionChart from './DistributionChart';

export const ChartsWrap = styled(Flex)`
  flex-wrap: wrap;
  width: 100%;
`;

const BALNSectionOverview = () => {
  const { data: allTokens } = useAllTokensByAddress();

  return (
    <BoxPanel bg="bg2" id="baln">
      <Flex alignItems="center">
        <Typography variant="h2" mb={5} mr={2}>
          Balance Tokens
        </Typography>
        <Typography color="text1" mb={3} fontSize={16}>
          {allTokens && `$${getFormattedNumber(allTokens[bnJs.BALN.address].price, 'number4')}`}
        </Typography>
      </Flex>
      <ChartsWrap>
        <DistributionChart />
        <BBALNChart />
      </ChartsWrap>
    </BoxPanel>
  );
};

export default BALNSectionOverview;
