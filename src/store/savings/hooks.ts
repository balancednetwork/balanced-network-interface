import React, { useCallback, useEffect } from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { BigNumber } from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { UseQueryResult, useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { Field } from '../loan/actions';
import { adjust, cancel, type, changeLockedAmount } from './actions';

export function useLockedAmount(): AppState['savings']['lockedAmount'] {
  return useSelector((state: AppState) => state.savings.lockedAmount);
}

export function useSavingsSliderState(): AppState['savings']['state'] {
  return useSelector((state: AppState) => state.savings.state);
}

export function useSavingsChangeLockedAmount(): (lockedAmount: CurrencyAmount<Token>) => void {
  const dispatch = useDispatch();
  return useCallback(
    (lockedAmount: CurrencyAmount<Token>) => {
      dispatch(changeLockedAmount({ lockedAmount }));
    },
    [dispatch],
  );
}

export function useFetchSavingsInfo(account?: string | null) {
  const transactions = useAllTransactions();
  const changeLockedAmount = useSavingsChangeLockedAmount();

  const fetchSavingsInfo = useCallback(
    async account => {
      if (account) {
        const lockedAmount = await bnJs.Savings.getLockedAmount(account);
        try {
          const lockedBnUSD = CurrencyAmount.fromRawAmount(
            SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address],
            lockedAmount,
          );
          changeLockedAmount(lockedBnUSD);
        } catch (e) {
          console.log(e);
        }
      }
    },
    [changeLockedAmount],
  );

  useEffect(() => {
    if (account) {
      fetchSavingsInfo(account);
    }
  }, [transactions, account, fetchSavingsInfo]);
}

export function useSavingsSliderActionHandlers() {
  const dispatch = useDispatch();

  const onFieldAInput = React.useCallback(
    (value: string) => {
      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'text' }));
    },
    [dispatch],
  );

  const onSlide = React.useCallback(
    (values: string[], handle: number) => {
      const value = new BigNumber(values[handle]);
      dispatch(
        type({
          independentField: Field.LEFT,
          typedValue: value.toFixed(),
          inputType: 'slider',
        }),
      );
    },
    [dispatch],
  );

  const onAdjust = React.useCallback(
    isAdjust => {
      if (isAdjust) {
        dispatch(adjust());
      } else {
        dispatch(cancel());
      }
    },
    [dispatch],
  );

  return {
    onFieldAInput,
    onSlide,
    onAdjust,
  };
}

export function useUnclaimedRewards(): UseQueryResult<CurrencyAmount<Token>[] | undefined> {
  const { account } = useIconReact();

  return useQuery(
    ['savingsRewards', account],
    async () => {
      if (!account) return;

      try {
        const rewardsRaw = await bnJs.Savings.getUnclaimedRewards(account);

        const rewards = Object.entries(rewardsRaw).reduce((acc, cur) => {
          const [address, rawAmount] = cur;
          acc.push(CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[address], rawAmount as string));
          return acc;
        }, [] as CurrencyAmount<Token>[]);

        return rewards;
      } catch (e) {
        console.log(e);
      }
    },
    {
      keepPreviousData: true,
      enabled: !!account,
      refetchInterval: 5000,
    },
  );
}
