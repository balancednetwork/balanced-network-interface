import React from 'react';

import BigNumber from 'bignumber.js';
import { IconBuilder } from 'icon-sdk-js';
import Nouislider from 'nouislider-react';
import {
  useIconReact,
  sICX_ADDRESS,
  LOAN_ADDRESS,
  BALN_ADDRESS,
  bnUSD_ADDRESS,
  BAND_ADDRESS,
  STAKING_ADDRESS,
  BALNbnUSDpoolId,
  DEX_ADDRESS,
} from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { ICONEX_RELAY_RESPONSE } from 'packages/iconex';
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
import { useWalletICXBalance } from 'hooks';
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

export function HomePage() {
  const { account, iconService } = useIconReact();

  const balance = useWalletICXBalance(account);

  // collateral
  const stakedICXAmount = useDepositedValue();
  const changeStakedICXAmount = useChangeDepositedValue();
  const updateUnStackedICXAmount = useChangeBalanceValue();
  updateUnStackedICXAmount(balance);

  // loan
  const loanBorrowedValue = useLoanBorrowedValue();
  const loanbnUSDbadDebt = useLoanbnUSDbadDebt();
  const loanbnUSDtotalSupply = useLoanbnUSDtotalSupply();
  const updateChangeLoanBorrowedValue = useLoanChangeBorrowedValue();
  const updateChangeLoanbnUSDbadDebt = useLoanChangebnUSDbadDebt();
  const updateChangeLoanbnUSDtotalSupply = useLoanChangebnUSDtotalSupply();

  // wallet
  const changeBalanceValue = useChangeWalletBalance();

  // ratio
  const ratioValue = useRatioValue();
  const changeRatioValue = useChangeRatio();

  // ratio
  const initRatioICXUSDratio = React.useCallback(() => {
    const callICXUSDratioParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(BAND_ADDRESS)
      .method('get_reference_data')
      .params({ _base: 'ICX', _quote: 'USD' })
      .build();
    const callSICXICXratioParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(STAKING_ADDRESS)
      .method('getTodayRate')
      .build();
    const callBALNbnUSDratioParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(DEX_ADDRESS)
      .method('getPrice')
      .params({ _pid: BALNbnUSDpoolId.toString() })
      .build();

    Promise.all([
      iconService.call(callICXUSDratioParams).execute(),
      iconService.call(callSICXICXratioParams).execute(),
      iconService.call(callBALNbnUSDratioParams).execute(),
    ]).then(([resultICXUSDratio, resultSICXICXratio, resultBALNbnUSDratioParams]) => {
      const ICXUSDratio = convertLoopToIcx(resultICXUSDratio['rate']);
      const sICXICXratio = convertLoopToIcx(resultSICXICXratio);
      const BALNbnUSDratio = convertLoopToIcx(resultBALNbnUSDratioParams);
      changeRatioValue({ ICXUSDratio });
      changeRatioValue({ sICXICXratio });
      changeRatioValue({ BALNbnUSDratio });
    });
  }, [account, changeRatioValue, iconService]);

  // wallet balance
  const initWalletBalance = React.useCallback(() => {
    const callSICXbalanceParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(sICX_ADDRESS)
      .method('balanceOf')
      .params({ _owner: account })
      .build();
    const callBALNbalanceParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(BALN_ADDRESS)
      .method('balanceOf')
      .params({ _owner: account })
      .build();
    const callbnUSDbalanceParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(bnUSD_ADDRESS)
      .method('balanceOf')
      .params({ _owner: account })
      .build();

    Promise.all([
      iconService.call(callSICXbalanceParams).execute(),
      iconService.call(callBALNbalanceParams).execute(),
      iconService.call(callbnUSDbalanceParams).execute(),
    ]).then(result => {
      const [sICXbalance, BALNbalance, bnUSDbalance] = result.map(v => convertLoopToIcx(v));
      changeBalanceValue({ sICXbalance });
      changeBalanceValue({ BALNbalance });
      changeBalanceValue({ bnUSDbalance });
    });
  }, [account, changeBalanceValue, iconService]);

  const initLoan = React.useCallback(() => {
    const callGetAvailableAssetsParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(LOAN_ADDRESS)
      .method('getAvailableAssets')
      .build();
    const callbnUSDtotalSupplyParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(bnUSD_ADDRESS)
      .method('totalSupply')
      .build();
    const callTotalDebtParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(LOAN_ADDRESS)
      .method('getAccountPositions')
      .params({ _owner: account })
      .build();

    Promise.all([
      iconService.call(callGetAvailableAssetsParams).execute(),
      iconService.call(callbnUSDtotalSupplyParams).execute(),
      iconService.call(callTotalDebtParams).execute(),
    ]).then(([resultGetAvailableAssets, resultbnUSDtotalSupply, resultTotalDebt]) => {
      const bnUSDbadDebt = convertLoopToIcx(resultGetAvailableAssets['ICD']['bad_debt']);
      const bnUSDtotalSupply = convertLoopToIcx(resultbnUSDtotalSupply);
      const totalDebt = convertLoopToIcx(resultTotalDebt['total_debt'] || 0);

      updateChangeLoanbnUSDbadDebt(bnUSDbadDebt);
      updateChangeLoanbnUSDtotalSupply(bnUSDtotalSupply);
      updateChangeLoanBorrowedValue(totalDebt);
    });
  }, [
    account,
    updateChangeLoanbnUSDbadDebt,
    updateChangeLoanbnUSDtotalSupply,
    updateChangeLoanBorrowedValue,
    iconService,
  ]);

  const initStakedICXBalance = React.useCallback(() => {
    const callParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(LOAN_ADDRESS)
      .method('getAccountPositions')
      .params({ _owner: account })
      .build();

    iconService
      .call(callParams)
      .execute()
      .then((result: BigNumber) => {
        const deposited = convertLoopToIcx(result['assets'] ? result['assets']['sICX'] : 0);

        changeStakedICXAmount(deposited);
      });
  }, [account, changeStakedICXAmount, iconService]);

  const initWebSocket = React.useCallback(() => {
    client.send(
      JSON.stringify({
        address: account,
      }),
    );
  }, [account]);

  React.useEffect(() => {
    if (account) {
      initRatioICXUSDratio();
      initWalletBalance();
      initLoan();
      initWebSocket();
      initStakedICXBalance();
    }
  }, [initRatioICXUSDratio, initWalletBalance, initLoan, initWebSocket, initStakedICXBalance, account]);

  const getAccountPositions = React.useCallback(() => {
    const callParams = new IconBuilder.CallBuilder()
      .from(account)
      .to(LOAN_ADDRESS)
      .method('getAccountPositions')
      .params({ _owner: account })
      .build();

    Promise.all([iconService.call(callParams).execute(), iconService.getBalance(account).execute()]).then(
      ([result, balance]) => {
        const stakedICXVal = convertLoopToIcx(result['assets'] ? result['assets']['sICX'] : 0);
        const unStakedVal = convertLoopToIcx(balance);
        updateUnStackedICXAmount(unStakedVal);
        changeStakedICXAmount(stakedICXVal);
      },
    );
  }, [account, updateUnStackedICXAmount, changeStakedICXAmount, iconService]);

  React.useEffect(() => {
    const handler = ({ detail: { type, payload } }: any) => {
      setTimeout(() => {
        if (account && type === 'RESPONSE_JSON-RPC') {
          getAccountPositions();
        }
      }, 5000);
    };

    window.addEventListener(ICONEX_RELAY_RESPONSE, handler);
    return () => {
      window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
    };
  }, [account, getAccountPositions]);

  // loan slider
  const totalLoanAmount = stakedICXAmount.div(4).minus(loanBorrowedValue);

  const totalCollateralValue = stakedICXAmount.times(ratioValue.ICXUSDratio === undefined ? 0 : ratioValue.ICXUSDratio);
  // const totalLoanBorrowedValue = loanBorrowedValue.times(new BigNumber(ratioValue.ICXUSDratio).toNumber());
  // const totalBorrowedAvailableValue = stakedICXAmount.times(new BigNumber(ratioValue.ICXUSDratio).toNumber());
  const debtHoldShare = loanBorrowedValue.div(loanbnUSDtotalSupply.minus(loanbnUSDbadDebt)).multipliedBy(100);

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
