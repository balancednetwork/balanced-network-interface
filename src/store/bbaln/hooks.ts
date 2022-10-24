import React, { useCallback, useEffect, useMemo } from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { BigNumber } from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import { LockedPeriod } from 'app/components/home/BBaln/types';
import { EXA, getBbalnAmount, WEIGHT } from 'app/components/home/BBaln/utils';
import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import useInterval from 'hooks/useInterval';
import { useRatesQuery } from 'queries/reward';
import { useBlockDetails } from 'store/application/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { formatUnits } from 'utils';

import { AppState } from '..';
import { Field } from '../loan/actions';
import { adjust, cancel, type, changeData, changePeriod, changeSources } from './actions';

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

export function useLockedPeriod(): AppState['bbaln']['lockedPeriod'] {
  return useSelector((state: AppState) => state.bbaln.lockedPeriod);
}

export function useBBalnSliderState(): AppState['bbaln']['state'] {
  return useSelector((state: AppState) => state.bbaln.state);
}

export function useTotalSuply(): AppState['bbaln']['totalSupply'] {
  return useSelector((state: AppState) => state.bbaln.totalSupply);
}

export function useSelectedPeriod(): AppState['bbaln']['state']['selectedPeriod'] {
  return useSelector((state: AppState) => state.bbaln.state.selectedPeriod);
}

export function useBBalnChangeSelectedPeriod(): (period: LockedPeriod) => void {
  const dispatch = useDispatch();
  return useCallback((period: LockedPeriod) => dispatch(changePeriod({ period })), [dispatch]);
}

export function useSources(): AppState['bbaln']['sources'] {
  return useSelector((state: AppState) => state.bbaln.sources);
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

export function useFetchBBalnInfo(account?: string | null) {
  const transactions = useAllTransactions();
  const changeData = useBBalnChangeData();

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

  useEffect(() => {
    if (account) {
      fetchBBalnInfo(account);
    }
  }, [transactions, account, fetchBBalnInfo]);
}

export function useBBalnSliderActionHandlers() {
  const dispatch = useDispatch();
  const lockedBaln = useLockedBaln();
  const lockedAmount = useMemo(() => {
    return new BigNumber(lockedBaln ? lockedBaln.toFixed() : 0);
  }, [lockedBaln]);

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
          typedValue: value.isLessThan(lockedAmount) ? '0' : value.toFixed(),
          inputType: 'slider',
        }),
      );
    },
    [dispatch, lockedAmount],
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

export function useHasLockExpired() {
  const lockedUntil = useLockedUntil();
  const now = new Date();

  return useQuery<boolean | undefined>(`hasLockExpired${lockedUntil}`, () => {
    return lockedUntil && now.getTime() > lockedUntil.getTime();
  });
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

export function useWorkingBalance() {
  const totalSupplyBBaln = useTotalSuply();
  const bbalnAmountDiff = useDBBalnAmountDiff();
  const dynamicBBalnAmount = useDynamicBBalnAmount();

  return useCallback(
    (balance: BigNumber, supply: BigNumber): BigNumber => {
      if (totalSupplyBBaln) {
        const limit = balance.times(EXA).dividedBy(WEIGHT);
        const workingBalance = balance.plus(
          supply
            .times(dynamicBBalnAmount)
            .times(EXA.minus(WEIGHT))
            .dividedBy(totalSupplyBBaln.plus(bbalnAmountDiff))
            .dividedBy(WEIGHT),
        );
        return BigNumber.min(limit, workingBalance);
      }

      return new BigNumber(0);
    },
    [totalSupplyBBaln, dynamicBBalnAmount, bbalnAmountDiff],
  );
}

export const usePastMonthFeesDistributed = () => {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: blockThen } = useBlockDetails(new Date(now).setDate(new Date().getDate() - 30));
  const { data: rates } = useRatesQuery();

  return useQuery(
    `PastMonthFeesDistributed${blockThen && blockThen.number}${rates && Object.keys(rates).length}`,
    async () => {
      if (blockThen?.number && rates) {
        try {
          console.log('running fees query');

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
            .times(0.6);
          const sICXFees = new BigNumber(formatUnits(sICXFeesNow))
            .minus(new BigNumber(formatUnits(sICXFeesThen)))
            .times(rates['sICX'])
            .times(0.6);
          const balnFees = new BigNumber(formatUnits(balnFeesNow))
            .minus(new BigNumber(formatUnits(balnFeesThen)))
            .times(rates['BALN'])
            .times(0.6);
          const loansFees = new BigNumber(formatUnits(loanFeesNow))
            .minus(new BigNumber(formatUnits(loanFeesThen)))
            .times(0.6);
          const fundFees = new BigNumber(formatUnits(fundFeesNow))
            .minus(new BigNumber(formatUnits(fundFeesThen)))
            .times(0.6);

          return {
            loans: loansFees,
            fund: fundFees,
            swapsBALN: balnFees,
            swapsSICX: sICXFees,
            swapsBnUSD: bnUSDFees,
            total: loansFees.plus(fundFees).plus(balnFees).plus(sICXFees).plus(bnUSDFees),
          };
        } catch (e) {
          console.error('Error calculating distributed fees: ', e);
        }
      }
    },
    { keepPreviousData: true },
  );
};
