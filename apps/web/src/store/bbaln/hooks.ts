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

export function useBBalnSliderState(): AppState['bbaln']['state'] {
  return useSelector((state: AppState) => state.bbaln.state);
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
