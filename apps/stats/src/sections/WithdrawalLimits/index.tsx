import { BoxPanel } from '@/components/Panel';
import QuestionHelper, { QuestionWrapper } from '@/components/QuestionHelper';
import React from 'react';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';
import { Typography } from '@/theme';
import CollateralLimits from './CollateralLimits';
import ExchangeLimits from './ExchangeLimits';
import StabilityFundLimits from './StabilityFundLimits';

const Tabs = styled(Box)`
  padding-top: 4px;
  display: grid;
  grid-auto-flow: column;
  column-gap: 1px;
`;

const Tab = styled.button<{ isActive: boolean }>`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  border-radius: 25px;
  background-color: ${({ theme, isActive }) => (isActive ? theme.colors.primary : theme.colors.bg3)};
  transition: all ease 0.3s;
  padding: 2px 10px 3px;
  margin: 0 3px;
  cursor: pointer;
  ${({ isActive }) => isActive && 'cursor: default'};
  border: 0;
  outline: none;
  appearance: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const WithdrawalLimits = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <BoxPanel bg="bg2" id="withdrawal-limits">
      <Flex alignItems="center" mb={5}>
        <Flex
          flexDirection={['column', 'column', 'row']}
          justifyContent="space-between"
          alignItems={['start', 'start', 'center']}
          width="100%"
        >
          <Flex mr={4}>
            <Typography variant="h2" mr={1}>
              Withdrawal limits
            </Typography>
            <QuestionWrapper mt="9px">
              <QuestionHelper
                width={290}
                text={`To protect assets on Balanced, the smart contracts limit the amount that can be withdrawn during a 24-hour period.`}
              />
            </QuestionWrapper>
          </Flex>
          <Tabs m={['10px 0 -20px', '10px 0 -20px', '0']}>
            <Tab isActive={activeTab === 0} onClick={() => setActiveTab(0)}>
              Collateral
            </Tab>
            <Tab isActive={activeTab === 1} onClick={() => setActiveTab(1)}>
              Exchange
            </Tab>
            <Tab isActive={activeTab === 2} onClick={() => setActiveTab(2)}>
              Stability Fund
            </Tab>
          </Tabs>
        </Flex>
      </Flex>

      {activeTab === 0 && <CollateralLimits />}
      {activeTab === 1 && <ExchangeLimits />}
      {activeTab === 2 && <StabilityFundLimits />}
    </BoxPanel>
  );
};

export default WithdrawalLimits;
