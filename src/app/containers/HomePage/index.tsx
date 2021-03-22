import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';

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
import { useAllTransactions } from 'store/transactions/hooks';
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

const PERIOD = 60 * 1000;

export function usePrice() {
  const changeRatioValue = useChangeRatio();

  // ICX / USD price
  useInterval(async () => {
    const res = await bnJs.Band.getReferenceData({ _base: 'ICX', _quote: 'USD' });
    const ICXUSDratio = convertLoopToIcx(res['rate']);
    changeRatioValue({ ICXUSDratio });
  }, PERIOD);

  // sICX / ICX price
  useInterval(async () => {
    const sICXICXratio = convertLoopToIcx(await bnJs.Staking.getTodayRate());
    changeRatioValue({ sICXICXratio });
  }, PERIOD);

  // BALN / bnUSD price
  // useInterval(async () => {
  //   const BALNbnUSDratio = convertLoopToIcx(await bnJs.Dex.getPrice(BalancedJs.utils.BALNbnUSDpoolId.toString()));
  //   changeRatioValue({ BALNbnUSDratio: BALNbnUSDratio });
  // }, PERIOD);

  // sICX / bnUSD price
  useInterval(async () => {
    const sICXbnUSDratio = convertLoopToIcx(await bnJs.Dex.getPrice(BalancedJs.utils.sICXbnUSDpoolId.toString()));
    changeRatioValue({ sICXbnUSDratio: sICXbnUSDratio });
  }, PERIOD);
}

export function useBalance(account: string) {
  // eject this account and we don't need to account params for when call contract
  bnJs.eject({ account });

  const changeBalanceValue = useChangeWalletBalance();

  const transactions = useAllTransactions();

  const fetchBalances = React.useCallback(() => {
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
    fetchBalances();
  }, [fetchBalances, transactions]);
}

export function useCollateralInfo(account: string) {
  const updateChangeLoanBorrowedValue = useLoanChangeBorrowedValue();
  const updateChangeLoanbnUSDbadDebt = useLoanChangebnUSDbadDebt();
  const updateChangeLoanbnUSDtotalSupply = useLoanChangebnUSDtotalSupply();
  const changeStakedICXAmount = useChangeDepositedValue();
  const updateUnStackedICXAmount = useChangeBalanceValue();
  const transactions = useAllTransactions();

  const fetchTotalCollateralInfo = React.useCallback(
    (account: string) => {
      if (account) {
        Promise.all([
          bnJs.Loans.eject({ account }).getAvailableAssets(),
          bnJs.bnUSD.totalSupply(),
          bnJs.Loans.eject({ account }).getAccountPositions(),
        ]).then(([resultGetAvailableAssets, resultbnUSDtotalSupply, resultbnUSDdebt]: Array<any>) => {
          const bnUSDbadDebt = convertLoopToIcx(resultGetAvailableAssets['bnUSD']['bad_debt']);
          const bnUSDtotalSupply = convertLoopToIcx(resultbnUSDtotalSupply);

          const bnUSDdebt = resultbnUSDdebt['assets']
            ? convertLoopToIcx(new BigNumber(parseInt(resultbnUSDdebt['assets']['bnUSD'] || 0, 16)))
            : new BigNumber(0);

          updateChangeLoanbnUSDbadDebt(bnUSDbadDebt);
          updateChangeLoanbnUSDtotalSupply(bnUSDtotalSupply);
          updateChangeLoanBorrowedValue(bnUSDdebt);
        });
      }
    },
    [updateChangeLoanbnUSDbadDebt, updateChangeLoanbnUSDtotalSupply, updateChangeLoanBorrowedValue],
  );

  const fetchCollateralInfo = React.useCallback(
    (account: string) => {
      Promise.all([
        bnJs.Loans.eject({ account }).getAccountPositions(),
        bnJs.contractSettings.provider.getBalance(account).execute(),
      ]).then(([stakedICXResult, balance]: Array<any>) => {
        const stakedICXVal = stakedICXResult['assets']
          ? convertLoopToIcx(new BigNumber(parseInt(stakedICXResult['assets']['sICX'], 16)))
          : new BigNumber(0);
        const unStakedVal = convertLoopToIcx(balance);

        changeStakedICXAmount(stakedICXVal);
        updateUnStackedICXAmount(unStakedVal);
      });
    },
    [updateUnStackedICXAmount, changeStakedICXAmount],
  );

  React.useEffect(() => {
    if (account) {
      fetchTotalCollateralInfo(account);
      fetchCollateralInfo(account);
    }
  }, [fetchTotalCollateralInfo, fetchCollateralInfo, account, transactions]);
}

export function HomePage() {
  const { account } = useIconReact();

  usePrice();
  useBalance(account || '');
  useCollateralInfo(account || '');

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
