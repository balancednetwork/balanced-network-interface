import React, { useCallback, useEffect } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { SUPPORTED_TOKENS_MAP_BY_ADDRESS, bnUSD } from '@/constants/tokens';
import { useTokenPrices } from '@/queries/backendv2';
import { useSupportedCollateralTokens } from '@/store/collateral/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

import { NETWORK_ID } from '@/constants/config';
import { AppState } from '..';
import { useBlockDetails } from '../application/hooks';
import { Field } from '../loan/reducer';
import { adjust, cancel, changeLockedAmount, type } from './reducer';

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
  return useQuery({
    queryKey: ['bnUSDtotalLocked'],
    queryFn: async () => {
      const totalLocked = await bnJs.bnUSD.balanceOf(bnJs.Savings.address);
      return CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address], totalLocked);
    },
    refetchInterval: 2000,
    placeholderData: keepPreviousData,
  });
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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

  return useQuery({
    queryKey: ['savingsRewards', account],
    queryFn: async () => {
      if (!account) return;

      const rewardsRaw = await bnJs.Savings.getUnclaimedRewards(account);

      const rewards = Object.entries(rewardsRaw).reduce((acc, cur) => {
        const [address, rawAmount] = cur;
        acc.push(CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[address], rawAmount as string));
        return acc;
      }, [] as CurrencyAmount<Token>[]);

      return rewards;
    },
    placeholderData: keepPreviousData,
    enabled: !!account,
    refetchInterval: 5000,
  });
}

function useTricklerAllowedTokens(): UseQueryResult<string[] | undefined> {
  return useQuery({
    queryKey: ['tricklerTokens'],
    queryFn: () => bnJs.Trickler.getAllowListTokens(),
    placeholderData: keepPreviousData,
  });
}

function useTricklerDistributionPeriod(): UseQueryResult<number | undefined> {
  return useQuery({
    queryKey: ['tricklerDistributionPeriod'],
    queryFn: () => bnJs.Trickler.getDistributionPeriod(),
    placeholderData: keepPreviousData,
  });
}

export function useSavingsRatePastMonthPayout(): UseQueryResult<BigNumber | undefined> {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: blockThen } = useBlockDetails(new Date(now).setDate(new Date().getDate() - 30));
  const { data: tokenPrices } = useTokenPrices();
  const { data: tokenList } = useTricklerAllowedTokens();

  return useQuery({
    queryKey: [`savingsRate`, blockThen?.number || '', Object.keys(tokenPrices ?? {}).length, tokenList?.length ?? ''],
    queryFn: async () => {
      if (tokenPrices === undefined || tokenList === undefined || blockThen === undefined) return;

      async function getRewards(blockHeight?: number): Promise<BigNumber> {
        const rewards = await Promise.all(
          tokenList!.map(async address => {
            const symbol = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address].symbol;
            try {
              const rewards = address && (await bnJs.Savings.getTotalPayout(address, blockHeight));
              const price = tokenPrices?.[symbol!];
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

      return monthlyRewards;
    },
    placeholderData: keepPreviousData,
    enabled: !!tokenPrices && !!tokenList && !!blockThen,
  });
}

export function useSavingsRateInfo(): UseQueryResult<
  | {
      totalLocked: CurrencyAmount<Token>;
      dailyPayout: BigNumber;
      APR: BigNumber;
      percentAPRsICX: BigNumber;
      percentAPRbnUSD: BigNumber;
      percentAPRBALN: BigNumber;
    }
  | undefined
> {
  const { data: tokenPrices } = useTokenPrices();
  const { data: totalLocked } = useTotalBnUSDLocked();
  const { data: tokenList } = useTricklerAllowedTokens();
  const { data: periodInBlocks } = useTricklerDistributionPeriod();
  const { data: collateralTokens } = useSupportedCollateralTokens();

  return useQuery({
    queryKey: [`savingsRate`, totalLocked, tokenPrices, tokenList, collateralTokens, periodInBlocks],
    queryFn: async () => {
      if (!tokenPrices || !tokenList || !collateralTokens || !totalLocked || !periodInBlocks) return;

      let sICXtricklerBalance: BigNumber | undefined = new BigNumber(0);
      let BALNtricklerBalance: BigNumber | undefined = new BigNumber(0);

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
              const amount = price?.times(new BigNumber(currencyAmount.toFixed())) ?? new BigNumber(0);
              if (symbol === 'sICX') sICXtricklerBalance = amount;
              if (symbol === 'BALN') BALNtricklerBalance = amount;
              return amount;
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
        Object.keys(collateralTokens).map(async symbol => {
          const totalDebtRaw = await bnJs.Loans.getTotalCollateralDebt(symbol, 'bnUSD');
          const interest = await bnJs.Loans.getInterestRate(symbol);
          const rate = new BigNumber(interest ?? 0).div(10000);
          const totalDebt = CurrencyAmount.fromRawAmount(bnUSD[NETWORK_ID], totalDebtRaw);
          return rate.times(new BigNumber(totalDebt.toFixed()));
        }),
      );

      const totalBnUSDLocked = new BigNumber(totalLocked.toFixed());

      const interestPayoutPerYear = rewardsFromInterests.reduce((acc, cur) => acc.plus(cur), new BigNumber(0));

      const dailyPayout = tricklerPayoutPerYear.plus(interestPayoutPerYear).div(365);

      const APR = tricklerPayoutPerYear.plus(interestPayoutPerYear).div(totalBnUSDLocked).times(100);

      const percentAPRBALN = BALNtricklerBalance.times(yearlyRatio).div(totalBnUSDLocked).times(100);

      const percentAPRsICX = sICXtricklerBalance.times(yearlyRatio).div(totalBnUSDLocked).times(100);

      const percentAPRbnUSD = APR.minus(percentAPRsICX).minus(percentAPRBALN);

      return {
        totalLocked,
        dailyPayout,
        APR,
        percentAPRsICX,
        percentAPRbnUSD,
        percentAPRBALN,
      };
    },
    placeholderData: keepPreviousData,
    enabled: !!tokenPrices && !!tokenList && !!collateralTokens && !!totalLocked && !!periodInBlocks,
  });
}
