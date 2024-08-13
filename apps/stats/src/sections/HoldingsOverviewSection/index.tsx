import React from 'react';

import { Link } from 'react-router-dom';
import { Flex } from 'rebass';
import styled from 'styled-components';

import arrowIcon from '@/assets/icons/arrow.svg?url';
import { BoxPanel } from '@/components/Panel';
import { LINKS } from '@/constants/links';
import { ChartsWrap } from '@/sections/BALNSection';
import { Typography } from '@/theme';

import POLChart from './POLChart';
import TokensChart from './TokensChart';
import BreakdownChart from './BreakdownChart';
import ReserveChart from './ReserveChart';

const StyledArrowLink = styled(Link)`
  color: #2fccdc;
  text-decoration: none;
  line-height: 40px;
  position: relative;
  padding: 0 30px 0 0;
  margin-top: -17px;

  &:after {
    content: '';
    display: block;
    position: absolute;
    background-image: url("${arrowIcon}");
    height: 10px;
    width: 20px;
    background-repeat: no-repeat;
    top: 16px;
    right: 0;
    transform: translate3d(5px, 0, 0);
    transition: transform 0.3s ease;
  }

  &:hover {
    &:after {
      transform: translate3d(15px, 0, 0);
    }
  }
`;

const BALNSectionOverview = () => {
  return (
    <BoxPanel bg="bg2" id="holdings">
      <Flex
        alignItems={['start', 'center']}
        justifyContent="space-between"
        flexWrap="wrap"
        flexDirection={['column', 'row']}
        mb={[3, 0]}
      >
        <Flex alignItems="center" mb={['-8px', '0']}>
          <Typography variant="h2" mb={5} mr={2}>
            Holdings
          </Typography>
        </Flex>
        <StyledArrowLink to={LINKS.performanceDetails}>Performance details</StyledArrowLink>
      </Flex>
      <ChartsWrap>
        <BreakdownChart />
        <TokensChart />
      </ChartsWrap>
      <ChartsWrap mt="50px">
        <POLChart />
        <ReserveChart />
      </ChartsWrap>
    </BoxPanel>
  );
};

export default BALNSectionOverview;
