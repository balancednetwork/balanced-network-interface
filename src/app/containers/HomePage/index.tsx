import React from 'react';

import BigNumber from 'bignumber.js';
import Nouislider from 'nouislider-react';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Helmet } from 'react-helmet-async';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import CollateralPanel from 'app/components/home/CollateralPanel';
import LoanPanel from 'app/components/home/LoanPanel';
import RewardsPanel from 'app/components/home/RewardsPanel';
import WalletPanel from 'app/components/home/WalletPanel';
import { DefaultLayout } from 'app/components/Layout';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import useInterval from 'hooks/useInterval';
import { useChangeDepositedValue, useDepositedValue, useChangeBalanceValue } from 'store/collateral/hooks';
import {
  useLoanBorrowedValue,
  useLoanbnUSDbadDebt,
  useLoanbnUSDtotalSupply,
  useLoanChangeBorrowedValue,
  useLoanChangebnUSDbadDebt,
  useLoanChangebnUSDtotalSupply,
} from 'store/loan/hooks';
import { useRatioValue, useChangeRatio } from 'store/ratio/hooks';
import { useChangeWalletBalance } from 'store/wallet/hooks';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`;

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

const client = new W3CWebSocket(`ws://35.240.219.80:8000/wss`);

const PERIOD = 10000;

export function usePrice() {
  const changeRatioValue = useChangeRatio();

  // ICX <-> USD price
  useInterval(async () => {
    const res = await bnJs.Band.getReferenceData({ _base: 'ICX', _quote: 'USD' });
    const ICXUSDratio = convertLoopToIcx(res['rate']);
    changeRatioValue({ ICXUSDratio });
  }, PERIOD);

  // sICX <-> ICX price
  useInterval(async () => {
    const res = await bnJs.Staking.getTodayRate();
    const sICXICXratio = convertLoopToIcx(res);
    changeRatioValue({ sICXICXratio });
  }, PERIOD);

  // sICX <-> ICX price
  useInterval(async () => {
    const res = await bnJs.Dex.getPrice({ _pid: BalancedJs.utils.BALNbnUSDpoolId.toString() });
    const BALNbnUSDratio = convertLoopToIcx(res);
    changeRatioValue({ BALNbnUSDratio });
  }, PERIOD);
}

export function useBalance() {
  const { account } = useIconReact();

  // wallet
  const changeBalanceValue = useChangeWalletBalance();

  // wallet balance
  const initWalletBalance = React.useCallback(() => {
    if (account) {
      Promise.all([
        bnJs.sICX.balanceOf({ account: account }),
        bnJs.Baln.balanceOf({ account: account }),
        bnJs.bnUSD.balanceOf({ account: account }),
      ]).then(result => {
        const [sICXbalance, BALNbalance, bnUSDbalance] = result.map(v => convertLoopToIcx(v as BigNumber));
        changeBalanceValue({ sICXbalance });
        changeBalanceValue({ BALNbalance });
        changeBalanceValue({ bnUSDbalance });
      });
    }
  }, [account, changeBalanceValue]);

  React.useEffect(() => {
    initWalletBalance();
  }, [initWalletBalance]);
}

export function useAccountPositions() {
  const { account, iconService } = useIconReact();
  const changeStakedICXAmount = useChangeDepositedValue();
  const updateUnStackedICXAmount = useChangeBalanceValue();

  const getAccountPositions = React.useCallback(() => {
    if (account) {
      Promise.all([bnJs.Loans.getAccountPositions({ account }), iconService.getBalance(account).execute()]).then(
        ([result, balance]: Array<any>) => {
          const stakedICXVal = convertLoopToIcx(result['assets'] ? result['assets']['sICX'] : 0);
          const unStakedVal = convertLoopToIcx(balance);
          updateUnStackedICXAmount(unStakedVal);
          changeStakedICXAmount(stakedICXVal);
        },
      );
    }
  }, [account, updateUnStackedICXAmount, changeStakedICXAmount, iconService]);

  useInterval(getAccountPositions, PERIOD);
}

export function useInitLoan() {
  const { account } = useIconReact();

  const updateChangeLoanBorrowedValue = useLoanChangeBorrowedValue();
  const updateChangeLoanbnUSDbadDebt = useLoanChangebnUSDbadDebt();
  const updateChangeLoanbnUSDtotalSupply = useLoanChangebnUSDtotalSupply();

  const initLoan = React.useCallback(() => {
    if (account) {
      Promise.all([
        bnJs.Loans.getAvailableAssets({ account }),
        bnJs.bnUSD.totalSupply(),
        bnJs.Loans.getAccountPositions({ account }),
      ]).then(([resultGetAvailableAssets, resultbnUSDtotalSupply, resultTotalDebt]: Array<any>) => {
        const bnUSDbadDebt = convertLoopToIcx(resultGetAvailableAssets['ICD']['bad_debt']);
        const bnUSDtotalSupply = convertLoopToIcx(resultbnUSDtotalSupply);
        const totalDebt = convertLoopToIcx(resultTotalDebt['total_debt'] || 0);

        updateChangeLoanbnUSDbadDebt(bnUSDbadDebt);
        updateChangeLoanbnUSDtotalSupply(bnUSDtotalSupply);
        updateChangeLoanBorrowedValue(totalDebt);
      });
    }
  }, [account, updateChangeLoanbnUSDbadDebt, updateChangeLoanbnUSDtotalSupply, updateChangeLoanBorrowedValue]);

  const initWebSocket = React.useCallback(() => {
    client.send(
      JSON.stringify({
        address: account,
      }),
    );
  }, [account]);

  React.useEffect(() => {
    if (account) {
      initLoan();
      initWebSocket();
    }
  }, [initLoan, initWebSocket, account]);
}

export function HomePage() {
  // collateral
  const stakedICXAmount = useDepositedValue();

  // loan
  const loanBorrowedValue = useLoanBorrowedValue();
  const loanbnUSDbadDebt = useLoanbnUSDbadDebt();
  const loanbnUSDtotalSupply = useLoanbnUSDtotalSupply();

  // ratio
  const ratioValue = useRatioValue();
  console.log(ratioValue);
  // ratio

  // loan slider
  const totalLoanAmount = stakedICXAmount.div(4).minus(loanBorrowedValue);

  const totalCollateralValue = stakedICXAmount.times(ratioValue.ICXUSDratio === undefined ? 0 : ratioValue.ICXUSDratio);
  const debtHoldShare = loanBorrowedValue.div(loanbnUSDtotalSupply.minus(loanbnUSDbadDebt)).multipliedBy(100);

  //////////////////////////////////////////////////////////////////
  usePrice();
  useBalance();
  useAccountPositions();
  useInitLoan();

  return (
    <DefaultLayout>
      <Helmet>
        <title>Home</title>
      </Helmet>

      <Grid>
        <CollateralPanel />

        <LoanPanel />

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
              The current ICX price is{' '}
              <span className="alert">{'$' + ratioValue.ICXUSDratio?.toFixed(2).toString()}</span>.
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

        <WalletPanel />

        <div>
          <RewardsPanel />
        </div>
      </Grid>
    </DefaultLayout>
  );
}
