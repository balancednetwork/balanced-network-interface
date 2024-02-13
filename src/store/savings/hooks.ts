import React, { useCallback, useEffect } from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { BigNumber } from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { UseQueryResult, useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_LIST, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useTokenPrices } from 'queries/backendv2';
import { useBlockDetails } from 'store/application/hooks';
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

export function useTotalBnUSDLocked(): UseQueryResult<CurrencyAmount<Token> | undefined> {
  return useQuery(
    'bnUSDtotalLocked',
    async () => {
      try {
        const totalLocked = await bnJs.bnUSD.balanceOf(bnJs.Savings.address);
        return CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address], totalLocked);
      } catch (e) {
        console.error('Error while fetching total locked bnUSD, return 0: ', e);
        return CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address], '0');
      }
    },
    {
      refetchInterval: 2000,
      keepPreviousData: true,
    },
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
      } else {
        changeLockedAmount(CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address], '0'));
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

export function useSavingsRate(): UseQueryResult<
  { totalLocked: CurrencyAmount<Token>; monthlyRewards: BigNumber; APR: BigNumber } | undefined
> {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: blockThen } = useBlockDetails(new Date(now).setDate(new Date().getDate() - 30));
  const { data: tokenPrices } = useTokenPrices();
  const { data: totalLocked } = useTotalBnUSDLocked();

  return useQuery(
    `savingsRate-${blockThen?.number || ''}-${totalLocked?.toFixed() || ''}-${Object.keys(tokenPrices ?? {}).length}`,
    async () => {
      if (tokenPrices === undefined || blockThen === undefined || totalLocked === undefined) return;
      const rewardsReceivedIn = ['sICX', 'bnUSD', 'BALN'];

      console.log('REFETCHING');

      async function getRewards(blockHeight?: number): Promise<BigNumber> {
        const rewards = await Promise.all(
          rewardsReceivedIn.map(async token => {
            const address = SUPPORTED_TOKENS_LIST.find(tokenObj => tokenObj.symbol === token)?.address || '';
            try {
              const rewards = address && (await bnJs.Savings.getTotalPayout(address, blockHeight));
              const price = tokenPrices?.[token];
              return new BigNumber(rewards).div(10 ** 18).times(price || 0);
            } catch (e) {
              console.error('Error while fetching bnUSD payout stats: ', e);
              return new BigNumber(0);
            }
          }),
        );
        return rewards.reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
      }

      const rewardsReceivedTotal = await getRewards();
      const rewardsReceivedThen = await getRewards(blockThen.number);
      const monthlyRewards = rewardsReceivedTotal.minus(rewardsReceivedThen);

      const APR = new BigNumber(monthlyRewards.times(12)).div(new BigNumber(totalLocked.toFixed())).times(100);

      return {
        totalLocked,
        monthlyRewards,
        APR,
      };
    },
    {
      keepPreviousData: true,
      enabled: !!tokenPrices && !!blockThen,
    },
  );
}
