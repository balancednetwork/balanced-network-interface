import React, { useCallback, useEffect } from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { BigNumber } from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { UseQueryResult, useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useTokenPrices } from 'queries/backendv2';
import { useSupportedCollateralTokens } from 'store/collateral/hooks';
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
        if (lockedAmount) {
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

function useTricklerAllowedTokens(): UseQueryResult<string[] | undefined> {
  return useQuery(
    'tricklerTokens',
    async () => {
      const tokens = await bnJs.Trickler.getAllowListTokens();
      return tokens;
    },
    {
      keepPreviousData: true,
    },
  );
}

function useTricklerDistributionPeriod(): UseQueryResult<number | undefined> {
  return useQuery(
    'tricklerDistributionPeriod',
    async () => {
      const periodInBlocks = await bnJs.Trickler.getDistributionPeriod();
      return periodInBlocks;
    },
    {
      keepPreviousData: true,
    },
  );
}

export function useSavingsRateInfo(): UseQueryResult<
  { totalLocked: CurrencyAmount<Token>; dailyPayout: BigNumber; APR: BigNumber } | undefined
> {
  const { data: tokenPrices } = useTokenPrices();
  const { data: totalLocked } = useTotalBnUSDLocked();
  const { data: tokenList } = useTricklerAllowedTokens();
  const { data: periodInBlocks } = useTricklerDistributionPeriod();
  const { data: collateralTokens } = useSupportedCollateralTokens();

  return useQuery(
    `savingsRate-${totalLocked?.toFixed() || ''}-${Object.keys(tokenPrices ?? {}).length}-${tokenList?.length ?? ''}-${
      Object.keys(collateralTokens ?? {}).length
    }-${periodInBlocks ?? ''}`,
    async () => {
      if (
        tokenPrices === undefined ||
        totalLocked === undefined ||
        tokenList === undefined ||
        collateralTokens === undefined ||
        periodInBlocks === undefined
      )
        return;

      async function getTricklerBalance(): Promise<BigNumber> {
        const amounts: BigNumber[] = await Promise.all(
          tokenList!.map(async tokenAddress => {
            const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[tokenAddress];
            const cx = bnJs.getContract(tokenAddress);
            try {
              const balanceRaw = await cx.balanceOf(bnJs.Trickler.address);
              const symbol = await cx.symbol();
              const currencyAmount = CurrencyAmount.fromRawAmount(token, balanceRaw);
              const price = tokenPrices?.[symbol];
              return price?.times(new BigNumber(currencyAmount.toFixed())) ?? new BigNumber(0);
            } catch (e) {
              console.error('Error while fetching bnUSD payout stats: ', e);
              return new BigNumber(0);
            }
          }),
        );
        return amounts.reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
      }

      const tricklerBalance = await getTricklerBalance();
      const distributionPeriodInSeconds = periodInBlocks * 2;
      const yearlyRatio = (60 * 60 * 24 * 365) / distributionPeriodInSeconds;
      const tricklerPayoutPerYear = tricklerBalance.times(yearlyRatio);

      const rewardsFromInterests = await Promise.all(
        Object.entries(collateralTokens).map(async ([symbol, address]) => {
          const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address];
          const totalDebtRaw = await bnJs.Loans.getTotalCollateralDebt(symbol, 'bnUSD');
          const interest = await bnJs.Loans.getInterestRate(symbol);
          const rate = new BigNumber(interest ?? 0).div(10000);
          const totalDebt = CurrencyAmount.fromRawAmount(token, totalDebtRaw);
          return rate.times(new BigNumber(totalDebt.toFixed()));
        }),
      );

      const interestPayoutPerYear = rewardsFromInterests.reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
      const dailyPayout = tricklerPayoutPerYear.plus(interestPayoutPerYear).div(365);
      const APR = tricklerPayoutPerYear
        .plus(interestPayoutPerYear)
        .div(new BigNumber(totalLocked.toFixed()))
        .times(100);

      return {
        totalLocked,
        dailyPayout,
        APR,
      };
    },
    {
      keepPreviousData: true,
      enabled: !!tokenPrices && !!tokenList && !!collateralTokens,
    },
  );
}
