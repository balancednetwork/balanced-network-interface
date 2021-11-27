import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { ZERO } from 'constants/index';
import { AppState } from 'store';
import { useBalance, usePool } from 'store/pool/hooks';

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

export function useLPData(poolId: number) {
  const pool = usePool(poolId);
  const balance = useBalance(poolId);

  return React.useMemo(() => {
    if (pool && balance) {
      return {
        totalBase: pool.base,
        totalQuote: pool.quote,
        totalLP: balance?.balance,
        suppliedLP: balance?.suppliedLP,
        suppliedBase: balance?.base,
        suppliedQuote: balance?.quote,
        stakedLPBalance: balance?.stakedLPBalance,
      };
    }
  }, [pool, balance]);
}

export const useTotalStaked = (poolId: number) => {
  const { account } = useIconReact();
  const balance = useBalance(poolId);
  const [totalStaked, setTotalStaked] = useState(ZERO);

  const stakedBalance = balance?.stakedLPBalance || ZERO;

  useEffect(() => {
    (async () => {
      if (account) {
        const availableStake = await bnJs.Dex.balanceOf(account, poolId);
        setTotalStaked(BalancedJs.utils.toIcx(availableStake).plus(stakedBalance));
      }
    })();
  }, [stakedBalance, account, poolId]);

  return totalStaked;
};

export function useStakedLPPercent(poolId: number): BigNumber {
  return useSelector((state: AppState) => state.stakedLP[poolId] ?? ZERO);
}
