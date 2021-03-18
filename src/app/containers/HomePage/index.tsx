import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
// import { main } from 'packages/icon/integration.test';
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
// import useInterval from 'hooks/useInterval';
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

export async function usePrice(account: string) {
  const changeRatioValue = useChangeRatio();

  if (!account) return;

  // // ICX <-> USD price
  // useInterval(async () => {
  const res = await bnJs.Band.getReferenceData({ _base: 'ICX', _quote: 'USD' });
  const ICXUSDratio = convertLoopToIcx(res['rate']);
  changeRatioValue({ ICXUSDratio });
  // }, PERIOD);

  // sICX <-> ICX price
  // const res = await bnJs.Staking.getTodayRate();
  // const sICXICXratio = convertLoopToIcx(res);
  // changeRatioValue({ sICXICXratio });
  const BALNbnUSDratio = await bnJs.Dex.getPrice({ _pid: BalancedJs.utils.BALNbnUSDpoolId.toString() });
  changeRatioValue({ BALNbnUSDratio: BALNbnUSDratio });
  // // sICX <-> ICX price
  // useInterval(async () => {
  //   const res = await bnJs.Dex.getPrice({ _pid: BalancedJs.utils.BALNbnUSDpoolId.toString() });
  //   const BALNbnUSDratio = convertLoopToIcx(res);
  //   changeRatioValue({ BALNbnUSDratio });
  // }, PERIOD);
}

export function useBalance(account: string) {
  // eject this account and we don't need to account params for when call contract
  bnJs.eject({ account });

  // wallet
  const changeBalanceValue = useChangeWalletBalance();

  // wallet balance
  const initWalletBalance = React.useCallback(() => {
    if (account) {
      Promise.all([
        bnJs.sICX.balanceOf(),
        bnJs.Baln.balanceOf(),
        bnJs.bnUSD.balanceOf(),
        bnJs.Rewards.getRewards(),
      ]).then(result => {
        const [sICXbalance, BALNbalance, bnUSDbalance, BALNreward] = result.map(v => convertLoopToIcx(v as BigNumber));
        changeBalanceValue({ sICXbalance });
        changeBalanceValue({ BALNbalance });
        changeBalanceValue({ bnUSDbalance });
        changeBalanceValue({ BALNreward });
      });
    }
  }, [account, changeBalanceValue]);

  React.useEffect(() => {
    initWalletBalance();
  }, [initWalletBalance]);
}

export function useInitLoan(account: string) {
  const updateChangeLoanBorrowedValue = useLoanChangeBorrowedValue();
  const updateChangeLoanbnUSDbadDebt = useLoanChangebnUSDbadDebt();
  const updateChangeLoanbnUSDtotalSupply = useLoanChangebnUSDtotalSupply();
  const changeStakedICXAmount = useChangeDepositedValue();
  const updateUnStackedICXAmount = useChangeBalanceValue();

  const initLoan = React.useCallback(
    (account: string) => {
      if (account) {
        Promise.all([
          bnJs.Loans.eject({ account }).getAvailableAssets(),
          bnJs.bnUSD.totalSupply(),
          bnJs.Loans.eject({ account }).getAccountPositions(),
        ]).then(([resultGetAvailableAssets, resultbnUSDtotalSupply, resultTotalDebt]: Array<any>) => {
          const bnUSDbadDebt = convertLoopToIcx(resultGetAvailableAssets['bnUSD']['bad_debt']);
          const bnUSDtotalSupply = convertLoopToIcx(resultbnUSDtotalSupply);

          const totalDebt = convertLoopToIcx(new BigNumber(parseInt(resultTotalDebt['total_debt'], 16)));

          updateChangeLoanbnUSDbadDebt(bnUSDbadDebt);
          updateChangeLoanbnUSDtotalSupply(bnUSDtotalSupply);
          updateChangeLoanBorrowedValue(totalDebt);
        });
      }
    },
    [updateChangeLoanbnUSDbadDebt, updateChangeLoanbnUSDtotalSupply, updateChangeLoanBorrowedValue],
  );

  const initBalance = React.useCallback(
    (account: string) => {
      if (account) {
        Promise.all([
          bnJs.Loans.eject({ account }).getAccountPositions(),
          bnJs.contractSettings.provider.getBalance(account).execute(),
        ]).then(([stakedICXResult, balance]: Array<any>) => {
          const stakedICXVal = stakedICXResult['assets']
            ? convertLoopToIcx(new BigNumber(parseInt(stakedICXResult['assets']['sICX'], 16)))
            : 0;
          const unStakedVal = convertLoopToIcx(balance);

          changeStakedICXAmount(stakedICXVal);
          updateUnStackedICXAmount(unStakedVal);
        });
      }
    },
    [updateUnStackedICXAmount, changeStakedICXAmount],
  );

  /*const initWebSocket = React.useCallback(
    (account: string) => {
      const client = new W3CWebSocket(`ws://35.240.219.80:8069/ws`);
      client.onopen = () => {
        client.send(
          JSON.stringify({
            address: account,
          }),
        );

        client.onmessage = (msgEvent: any) => {
          const { data } = JSON.parse(msgEvent.data);

          initBalance(account);
          //alert(`https://bicon.tracker.solidwallet.io/transaction/${data.raw.txHash}`);
          alert(`https://bicon.tracker.solidwallet.io/transaction/${JSON.stringify(data)}`);
        };
      };
    },
    [initBalance],
  );*/

  React.useEffect(() => {
    if (account) {
      initBalance(account);
      initLoan(account);
      //initWebSocket(account);
    }
  }, [
    initLoan,
    //initWebSocket,
    initBalance,
    account,
  ]);
}

export function HomePage() {
  const { account } = useIconReact();

  usePrice(`${account || ''}`);
  useBalance(`${account || ''}`);
  useInitLoan(`${account || ''}`);

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
