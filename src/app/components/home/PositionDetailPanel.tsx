import React from 'react';

import Nouislider from 'nouislider-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { useDepositedValue } from 'store/collateral/hooks';
import { useLoanBorrowedValue, useLoanbnUSDbadDebt, useLoanbnUSDtotalSupply } from 'store/loan/hooks';
import { useRatioValue } from 'store/ratio/hooks';

const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: 2 / 1 / 2 / 3;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
    flex-direction: column;
  `}
`;

const Chip = styled(Box)`
  display: inline-block;
  min-width: 82px;
  text-align: center;
  border-radius: 100px;
  padding: 1px 10px;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.4;
`;

const PositionDetailPanel = () => {
  // ratio
  const ratioValue = useRatioValue();
  // collateral
  const stakedICXAmount = useDepositedValue();

  // loan
  const loanBorrowedValue = useLoanBorrowedValue();
  const loanbnUSDbadDebt = useLoanbnUSDbadDebt();
  const loanbnUSDtotalSupply = useLoanbnUSDtotalSupply();

  // loan slider
  const totalLoanAmount = stakedICXAmount.div(4).minus(loanBorrowedValue);

  const totalCollateralValue = stakedICXAmount.times(ratioValue.ICXUSDratio === undefined ? 0 : ratioValue.ICXUSDratio);
  const debtHoldShare = loanBorrowedValue.div(loanbnUSDtotalSupply.minus(loanbnUSDbadDebt)).multipliedBy(100);

  return (
    <ActivityPanel bg="bg2">
      <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 350]}>
        <Typography variant="h2" mb={5}>
          Position detail
        </Typography>

        <Flex>
          <Box width={1 / 2} className="border-right">
            <Typography>Collateral</Typography>
            <Typography variant="p">{'$' + totalCollateralValue.toFixed(2).toString()}</Typography>
          </Box>
          <Box width={1 / 2} sx={{ textAlign: 'right' }}>
            <Typography>Loan</Typography>
            <Typography variant="p">
              {'$' + loanBorrowedValue.toFixed(2).toString() + ' / $' + totalLoanAmount.toFixed(2).toString()}
            </Typography>
          </Box>
        </Flex>
        <Divider my={4} />
        <Typography mb={2}>
          The current ICX price is <span className="alert">{'$' + ratioValue.ICXUSDratio?.toFixed(2).toString()}</span>.
        </Typography>
        <Typography>
          You hold{' '}
          <span className="white">
            {isNaN(debtHoldShare.toNumber()) ? '0%' : debtHoldShare.toFixed(2).toString() + '%'}
          </span>{' '}
          of the total debt.
        </Typography>
      </BoxPanel>
      <BoxPanel bg="bg2" flex={1}>
        <Typography variant="h3">Risk ratio</Typography>

        <Flex alignItems="center" justifyContent="space-between" my={4}>
          <Chip bg="primary">Low risk</Chip>
          <Box flex={1} mx={1}>
            <Nouislider
              disabled={true}
              id="risk-ratio"
              start={[0]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [15000],
              }}
            />
          </Box>
          <Chip bg="red">Liquidated</Chip>
        </Flex>

        <Divider my={3} />

        <Flex flexWrap="wrap" alignItems="flex-end">
          <Box width={[1, 1 / 2]}>
            <Flex alignItems="center" mb={15}>
              <Typography variant="h3" mr={15}>
                Rebalancing
              </Typography>
              <DropdownText text="Past week">
                <MenuList>
                  <MenuItem>Day</MenuItem>
                  <MenuItem>Week</MenuItem>
                  <MenuItem>Month</MenuItem>
                </MenuList>
              </DropdownText>
            </Flex>
            <Flex>
              <Box width={1 / 2}>
                <Typography variant="p">0 ICD</Typography>
                <Typography>Collateral sold</Typography>
              </Box>
              <Box width={1 / 2}>
                <Typography variant="p">0 ICD</Typography>
                <Typography>Loan repaid</Typography>
              </Box>
            </Flex>
          </Box>

          <Box width={[1, 1 / 2]}>
            <Typography>
              Traders can repay loans by selling ICD for $1 of ICX collateral. Your position will rebalance based on
              your % of the total debt.
            </Typography>
          </Box>
        </Flex>
      </BoxPanel>
    </ActivityPanel>
  );
};

export default PositionDetailPanel;
