import { useCallback, useEffect, useMemo } from 'react';

import { Fraction } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import { getClosestUnixWeekStart } from 'app/components/home/BBaln/utils';
import bnJs from 'bnJs';
import { AppState } from 'store';
import { useRewardsPercentDistribution } from 'store/reward/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { ONE_DAY_DURATION } from 'utils';

import { changeEditing, changeInputValue, changePowerLeft, changeShowConfirmation, changeUserData } from './actions';
import { VoteItemInfo, VoteItemInfoRaw, VoteSource, VoteSourceRaw } from './types';

export const WEIGHT_CONST = 10 ** 18;

export function useUserVoteData(): AppState['liveVoting']['userData'] {
  return useSelector((state: AppState) => state.liveVoting.userData);
}

export function useEditState(): AppState['liveVoting']['editState'] {
  return useSelector((state: AppState) => state.liveVoting.editState);
}

export function usePowerLeft(): AppState['liveVoting']['powerLeft'] {
  return useSelector((state: AppState) => state.liveVoting.powerLeft);
}

export function useSourceVoteData(): UseQueryResult<Map<string, VoteSource>, Error> {
  const transactions = useAllTransactions();
  return useQuery(
    [`sourceVoteData-${transactions && Object.keys(transactions).length}`],
    async () => {
      const data: { [key in string]: VoteSourceRaw } = await bnJs.Rewards.getSourceVoteData();

      return Object.keys(data).reduce((sources, source) => {
        try {
          const votable = parseInt(data[source].votable, 16) === 1;
          if (votable)
            sources[source] = {
              type: parseInt(data[source].type, 16),
              weight: new Fraction(data[source].weight, WEIGHT_CONST),
              currentWeight: new Fraction(data[source].currentWeight, WEIGHT_CONST),
              currentBias: new BigNumber(data[source].currentBias),
              currentSlope: new BigNumber(data[source].currentSlope),
            };
        } catch (e) {
          console.error(e);
        } finally {
          return sources;
        }
      }, {});
    },
    { keepPreviousData: true },
  );
}

export function useCombinedVoteData(): UseQueryResult<Map<string, VoteSource>, Error> {
  const { data: voteData } = useSourceVoteData();
  const { data: distribution } = useRewardsPercentDistribution();

  return useQuery(
    `combinedVoteData${voteData && Object.keys(voteData).length}${distribution && Object.keys(distribution).length}`,
    () => {
      if (voteData && distribution) {
        const distributionFixedSources = Object.keys(distribution.Fixed);

        return Object.keys(voteData).reduce((sources, source) => {
          if (distributionFixedSources.indexOf(source) >= 0) {
            try {
              sources[source].weight = sources[source].weight.add(distribution.Fixed[source]);
            } catch (e) {
              console.error(e);
            }
          }
          return sources;
        }, voteData);
      }
    },
    {
      keepPreviousData: true,
      refetchInterval: undefined,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );
}

function useChangeUserVoteData() {
  const dispatch = useDispatch();

  return useCallback(
    (userData: AppState['liveVoting']['userData']) => {
      dispatch(changeUserData({ userData }));
    },
    [dispatch],
  );
}

function useChangePowerLeft() {
  const dispatch = useDispatch();

  return useCallback(
    (powerLeft: AppState['liveVoting']['powerLeft']) => {
      dispatch(changePowerLeft({ powerLeft }));
    },
    [dispatch],
  );
}

export function useChangeEditing() {
  const dispatch = useDispatch();

  return useCallback(
    (editing: AppState['liveVoting']['editState']['editing']) => {
      dispatch(changeEditing({ editing }));
    },
    [dispatch],
  );
}

export function useChangeInputValue() {
  const dispatch = useDispatch();

  return useCallback(
    (inputValue: AppState['liveVoting']['editState']['inputValue']) => {
      dispatch(changeInputValue({ inputValue }));
    },
    [dispatch],
  );
}

export function useChangeShowConfirmation() {
  const dispatch = useDispatch();

  return useCallback(
    (showConfirmation: AppState['liveVoting']['editState']['showConfirmation']) => {
      dispatch(changeShowConfirmation({ showConfirmation }));
    },
    [dispatch],
  );
}

export function useFetchUserVoteData(): void {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const changeUserData = useChangeUserVoteData();
  const changePowerLeft = useChangePowerLeft();

  const fetchData = useCallback(async () => {
    if (account) {
      const data: Map<string, VoteItemInfoRaw> = await bnJs.Rewards.getUserVoteData(account!);

      const userVoteData = Object.keys(data).reduce((userVoteData, rawItem) => {
        try {
          userVoteData[rawItem] = {
            slope: new BigNumber(data[rawItem].slope),
            power: new Fraction(data[rawItem].power, 10000),
            end: new Date(parseInt(data[rawItem].end, 16) / 1000),
            lastVote: new Date(parseInt(data[rawItem].lastVote, 16) / 1000),
          };
        } catch (e) {
          console.error(e);
        } finally {
          return userVoteData;
        }
      }, {} as Map<string, VoteItemInfo>);

      const powerLeft = new Fraction(1).subtract(
        Object.values(userVoteData).reduce((total, item) => total.add(item.power), new Fraction(0)),
      );

      changePowerLeft(powerLeft);
      changeUserData(userVoteData);
    }
  }, [account, changeUserData, changePowerLeft]);

  useEffect(() => {
    fetchData();
  }, [transactions, account, fetchData]);
}

export function useEditValidation(): boolean {
  const userVoteData = useUserVoteData();
  const { inputValue, editing } = useEditState();
  const powerLeft = usePowerLeft();

  if (userVoteData && powerLeft && inputValue && editing) {
    const inputFraction = new Fraction(new BigNumber(inputValue).times(10000000).toFixed(0), 1000000000);
    if (userVoteData[editing]) {
      return !powerLeft.add(userVoteData[editing].power).lessThan(inputFraction);
    } else {
      return !powerLeft.lessThan(inputFraction);
    }
  } else {
    return true;
  }
}

export function useUnlockDateToBeSet(): UseQueryResult<string, Error> {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;
  const unlockDate = new Date(now + ONE_DAY_DURATION * 10);

  return useQuery('unlockDate', async () => {
    return unlockDate.toLocaleDateString('en-US', { month: 'long', day: '2-digit' });
  });
}

export function useNextUpdateDate(): Date {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  return getClosestUnixWeekStart(now);
}

export function useTotalBBalnAllocated(): UseQueryResult<BigNumber | undefined, Error> {
  const { data: voteData } = useSourceVoteData();
  const types = useMemo(() => voteData && Object.values(voteData).map(source => source.type), [voteData]);

  return useQuery(['totalBBalnAllocation', types], async () => {
    if (types) {
      const allocations: string[] = [];
      await Promise.all(
        types
          .filter((value, index, self) => self.indexOf(value) === index)
          .map(type => bnJs.Rewards.getWeightsSumPerType(type)),
      ).then(res => {
        try {
          res.forEach(typeAllocation => allocations.push(typeAllocation.bias));
        } catch (e) {
          console.error(e);
        }
      });

      return allocations.length
        ? allocations.reduce(
            (total, typeAllocation) => total.plus(new BigNumber(typeAllocation).div(10 ** 18)),
            new BigNumber(0),
          )
        : undefined;
    }
  });
}
