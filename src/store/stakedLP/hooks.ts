import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { ZERO } from 'constants/index';
import { AppState } from 'store';
import { useAllTransactions } from 'store/transactions/hooks';

import { setStakedLPPercent } from './actions';

export function useChangeStakedLPPercent(): (poolId: number, percent: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (poolId, percent) => {
      dispatch(setStakedLPPercent({ poolId, percent }));
    },
    [dispatch],
  );
}

export const useStakedBalance = (poolId: number) => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [stakedBalance, setStakedBalance] = useState(ZERO);

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.StakedLP.balanceOf(account, poolId);
        setStakedBalance(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, poolId, transactions]);

  return stakedBalance;
};

export const useTotalStaked = (poolId: number) => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [totalStaked, setTotalStaked] = useState(ZERO);
  const stakedBalance = useStakedBalance(poolId);

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Dex.balanceOf(account, poolId);
        setTotalStaked(BalancedJs.utils.toIcx(result).plus(stakedBalance));
      }
    })();
  }, [transactions, stakedBalance, account, poolId]);

  return totalStaked;
};

export function useStakedLPPercent(poolId: number): BigNumber {
  return useSelector((state: AppState) => state.stakedLP[poolId] ?? ZERO);
}
