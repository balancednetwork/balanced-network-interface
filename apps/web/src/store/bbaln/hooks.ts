import React, { useCallback, useEffect, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from '@/bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import useInterval from '@/hooks/useInterval';
import { BalanceData } from '@/hooks/useV2Pairs';
import { PairData, useTokenPrices } from '@/queries/backendv2';
import { useBlockDetails } from '@/store/application/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { formatUnits } from '@/utils';

import { LockedPeriod } from '@/app/components/home/BBaln/types';
import { EXA, WEIGHT, getBbalnAmount } from '@/app/components/home/BBaln/utils';
import { AppState } from '..';
import { adjust, cancel, changeData, changePeriod, changeSources, changeTotalSupply, type } from './reducer';

const PERCENTAGE_DISTRIBUTED = new BigNumber(0.3);
const ENSHRINEMENT_RATIO = new BigNumber(0.5);

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export type Source = {
  balance: BigNumber;
  supply: BigNumber;
  workingBalance: BigNumber;
  workingSupply: BigNumber;
};

export function useBBalnAmount(): AppState['bbaln']['bbalnAmount'] {
  return useSelector((state: AppState) => state.bbaln.bbalnAmount);
}

export function useLockedUntil(): AppState['bbaln']['lockedUntil'] {
  return useSelector((state: AppState) => state.bbaln.lockedUntil);
}

export function useLockedBaln(): AppState['bbaln']['lockedBaln'] {
  return useSelector((state: AppState) => state.bbaln.lockedBaln);
}

export function useBBalnSliderState(): AppState['bbaln']['state'] {
  return useSelector((state: AppState) => state.bbaln.state);
}

export function useTotalSupply(): AppState['bbaln']['totalSupply'] {
  return useSelector((state: AppState) => state.bbaln.totalSupply);
}

export function useSelectedPeriod(): AppState['bbaln']['state']['selectedPeriod'] {
  return useSelector((state: AppState) => state.bbaln.state.selectedPeriod);
}

export function useBBalnChangeSources(): (sources: { [key in string]: Source }) => void {
  const dispatch = useDispatch();
  return useCallback((sources: { [key in string]: Source }) => dispatch(changeSources({ sources })), [dispatch]);
}

export function useBBalnChangeData(): (
  lockedBaln: CurrencyAmount<Token>,
  lockEnd: Date,
  bbalnAmount: BigNumber,
  totalSupply: BigNumber,
) => void {
  const dispatch = useDispatch();
  return useCallback(
    (lockedBaln: CurrencyAmount<Token>, lockEnd: Date, bbalnAmount: BigNumber, totalSupply: BigNumber) => {
      dispatch(changeData({ lockedBaln, lockEnd, bbalnAmount, totalSupply }));
    },
    [dispatch],
  );
}

export function useBBalnChangeTotalSupply(): (totalSupply: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    totalSupply => {
      dispatch(changeTotalSupply({ totalSupply }));
    },
    [dispatch],
  );
}

export function useFetchBBalnInfo(account?: string | null) {
  const transactions = useAllTransactions();
  const changeData = useBBalnChangeData();
  const changeTotalSupply = useBBalnChangeTotalSupply();

  const fetchBBalnInfo = useCallback(
    account => {
      if (account) {
        Promise.all([bnJs.BBALN.getLocked(account), bnJs.BBALN.balanceOf(account), bnJs.BBALN.totalSupply()]).then(
          ([locked, bbaln, supply]: [{ amount: string; end: string }, number, number]) => {
            try {
              const lockedBaln = CurrencyAmount.fromRawAmount(
                SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.BALN.address],
                locked.amount,
              );
              const lockEnd = new Date(parseInt(locked.end, 16) / 1000);
              const bbalnAmount = new BigNumber(bbaln).div(10 ** 18);
              const totalSupply = new BigNumber(supply).div(10 ** 18);

              changeData(lockedBaln, lockEnd, bbalnAmount, totalSupply);
            } catch (e) {
              console.error(e);
            }
          },
        );
      }
    },
    [changeData],
  );

  const fetchBBalnTotalSupply = useCallback(async () => {
    const data = await bnJs.BBALN.totalSupply();
    try {
      const totalSupply = new BigNumber(data).div(10 ** 18);
      changeTotalSupply(totalSupply);
    } catch (e) {
      console.log(e);
    }
  }, [changeTotalSupply]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (account) {
      fetchBBalnInfo(account);
    } else {
      fetchBBalnTotalSupply();
    }
  }, [transactions, account, fetchBBalnInfo, fetchBBalnTotalSupply]);
}

export function useFetchBBalnSources(interval?: number, omitImmediateCall?: boolean) {
  const { account } = useIconReact();
  const changeSources = useBBalnChangeSources();

  const fetchSources = async () => {
    if (account) {
      const data = await bnJs.Rewards.getBoostData(account);

      changeSources(
        Object.keys(data).reduce((sources, sourceName) => {
          sources[sourceName] = {
            balance: new BigNumber(data[sourceName].balance),
            supply: new BigNumber(data[sourceName].supply),
            workingBalance: new BigNumber(data[sourceName].workingBalance),
            workingSupply: new BigNumber(data[sourceName].workingSupply),
          } as Source;
          return sources;
        }, {}),
      );
    }
  };

  useInterval(fetchSources, interval || 3000);
  !omitImmediateCall && fetchSources();
}

export function useDynamicBBalnAmount() {
  const { typedValue } = useBBalnSliderState();
  const selectedPeriod = useSelectedPeriod();
  const balnSliderAmount = useMemo(() => new BigNumber(typedValue), [typedValue]);

  return useMemo(() => getBbalnAmount(balnSliderAmount, selectedPeriod), [balnSliderAmount, selectedPeriod]);
}

export function useDBBalnAmountDiff() {
  const { isAdjusting } = useBBalnSliderState();
  const selectedPeriod = useSelectedPeriod();
  const { typedValue } = useBBalnSliderState();
  const bBalnAmount = useBBalnAmount();
  const balnSliderAmount = useMemo(() => new BigNumber(typedValue), [typedValue]);

  return useMemo(() => {
    if (isAdjusting) {
      return getBbalnAmount(balnSliderAmount, selectedPeriod).minus(bBalnAmount).abs();
    } else {
      return new BigNumber(0);
    }
  }, [isAdjusting, selectedPeriod, bBalnAmount, balnSliderAmount]);
}

export const usePastMonthFeesDistributed = () => {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: blockThen } = useBlockDetails(new Date(now).setDate(new Date().getDate() - 30));
  const { data: rates } = useTokenPrices();

  return useQuery({
    queryKey: [`PastMonthFeesDistributed`, blockThen && blockThen.number, rates && Object.keys(rates).length],
    queryFn: async () => {
      if (!blockThen || !rates) return;

      const loanFeesNow = await bnJs.FeeHandler.getLoanFeesAccrued();
      const loanFeesThen = await bnJs.FeeHandler.getLoanFeesAccrued(blockThen.number);

      const fundFeesNow = await bnJs.FeeHandler.getStabilityFundFeesAccrued();
      const fundFeesThen = await bnJs.FeeHandler.getStabilityFundFeesAccrued(blockThen.number);

      //swap fees
      const bnUSDFeesNow = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.bnUSD.address);
      const bnUSDFeesThen = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.bnUSD.address, blockThen.number);

      const sICXFeesNow = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.sICX.address);
      const sICXFeesThen = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.sICX.address, blockThen.number);

      const balnFeesNow = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.BALN.address);
      const balnFeesThen = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.BALN.address, blockThen.number);

      const bnUSDFees = new BigNumber(formatUnits(bnUSDFeesNow))
        .minus(new BigNumber(formatUnits(bnUSDFeesThen)))
        .times(ENSHRINEMENT_RATIO)
        .times(PERCENTAGE_DISTRIBUTED);
      const sICXFees = new BigNumber(formatUnits(sICXFeesNow))
        .minus(new BigNumber(formatUnits(sICXFeesThen)))
        .times(rates['sICX'])
        .times(ENSHRINEMENT_RATIO)
        .times(PERCENTAGE_DISTRIBUTED);
      const balnFees = new BigNumber(formatUnits(balnFeesNow))
        .minus(new BigNumber(formatUnits(balnFeesThen)))
        .times(rates['BALN'])
        .times(ENSHRINEMENT_RATIO)
        .times(PERCENTAGE_DISTRIBUTED);
      const loansFees = new BigNumber(formatUnits(loanFeesNow))
        .minus(new BigNumber(formatUnits(loanFeesThen)))
        .times(ENSHRINEMENT_RATIO)
        .times(PERCENTAGE_DISTRIBUTED);
      const fundFees = new BigNumber(formatUnits(fundFeesNow))
        .minus(new BigNumber(formatUnits(fundFeesThen)))
        .times(ENSHRINEMENT_RATIO)
        .times(PERCENTAGE_DISTRIBUTED);

      return {
        loans: loansFees,
        fund: fundFees,
        swapsBALN: balnFees,
        swapsSICX: sICXFees,
        swapsBnUSD: bnUSDFees,
        total: loansFees.plus(fundFees).plus(balnFees).plus(sICXFees).plus(bnUSDFees),
      };
    },
    enabled: !!blockThen && !!rates,
    placeholderData: keepPreviousData,
  });
};
