import React, { useEffect, useState } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { ZERO } from 'constants/index';
import { useBalance } from 'hooks/usePools';
import { AppState } from 'store';

import { setStakedLPPercent, setWithdrawnValue } from './actions';

export function useChangeStakedLPPercent(): (poolId: number, percent: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (poolId, percent) => {
      dispatch(setStakedLPPercent({ poolId, percent }));
    },
    [dispatch],
  );
}

export function useChangeWithdrawnValue(): (
  poolId: number,
  percent: BigNumber,
  baseValue: CurrencyAmount<Currency>,
  quoteValue: CurrencyAmount<Currency>,
) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (poolId, percent, baseValue, quoteValue) => {
      dispatch(setWithdrawnValue({ poolId, percent, baseValue, quoteValue }));
    },
    [dispatch],
  );
}

export const useTotalStaked = (poolId: number) => {
  const { account } = useIconReact();
  const balance = useBalance(poolId);
  const [totalStaked, setTotalStaked] = useState(ZERO);
  const stakedBalance = balance?.stakedLPBalance || ZERO;
  const decimal0 = balance?.base?.currency?.decimals || 0;
  const decimal1 = balance?.quote?.currency?.decimals || 0;
  const decimals = decimal0 !== decimal1 ? (decimal0 + decimal1) / 2 : decimal0;
  useEffect(() => {
    (async () => {
      if (account) {
        const availableStake = await bnJs.Dex.balanceOf(account, poolId);
        setTotalStaked(BalancedJs.utils.toFormat(availableStake, decimals).plus(stakedBalance.toFixed()));
      }
    })();
  }, [stakedBalance, account, poolId, decimals]);

  return totalStaked;
};

export function useStakedLPPercent(poolId: number): BigNumber {
  return useSelector((state: AppState) => state.stakedLP.stakedLp[poolId] ?? ZERO);
}

export function useWithdrawnPercent(poolId: number) {
  return useSelector((state: AppState) => state.stakedLP.withdrawn[poolId]);
}
