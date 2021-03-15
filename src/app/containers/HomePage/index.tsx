import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

import CollateralPanel from 'app/components/home/CollateralPanel';
import LoanPanel from 'app/components/home/LoanPanel';
import PositionDetailPanel from 'app/components/home/PositionDetailPanel';
import RewardsPanel from 'app/components/home/RewardsPanel';
import WalletPanel from 'app/components/home/WalletPanel';
import { DefaultLayout } from 'app/components/Layout';
import bnJs from 'bnJs';
import useInterval from 'hooks/useInterval';
import { useChangeDepositedValue, useChangeBalanceValue } from 'store/collateral/hooks';
import { useLoanChangeBorrowedValue, useLoanChangebnUSDbadDebt, useLoanChangebnUSDtotalSupply } from 'store/loan/hooks';
import { useChangeRatio } from 'store/ratio/hooks';
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

        <PositionDetailPanel />

        <WalletPanel />

        <div>
          <RewardsPanel />
        </div>
      </Grid>
    </DefaultLayout>
  );
}
