import { useMemo } from 'react';

import { CallData } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { useIconReact } from 'packages/icon-react';
import { UseQueryResult, useQuery } from 'react-query';

import { WEEK_IN_MS, getClosestUnixWeekStart } from 'app/components/home/BBaln/utils';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { useCombinedVoteData } from 'store/liveVoting/hooks';
import { useAllTransactions } from 'store/transactions/hooks';

import { Bribe, BribeToken, SourceName } from './types';

const FUTURE_REWARDS_COUNT = 3;

export function useBribes(): UseQueryResult<Bribe[], Error> {
  const { data: voteData } = useCombinedVoteData();
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const txCount = useMemo(() => (transactions ? Object.keys(transactions).length : 0), [transactions]);

  const sourceNames = useMemo(() => {
    if (voteData) return Object.keys(voteData);
    return [];
  }, [voteData]);

  return useQuery(
    `bribes-${sourceNames.length}-${account}-${txCount}`,
    async () => {
      const cds: CallData[] = sourceNames.map(sourceName => ({
        target: bnJs.Bribe.address,
        method: 'bribesPerSource',
        params: [sourceName],
      }));

      const tokensForBribedPools = await bnJs.Multicall.getAggregateData(cds);

      const bribedPools = [...sourceNames].reduce((pools, current, index) => {
        if (tokensForBribedPools[index].length) {
          pools[current] = tokensForBribedPools[index];
        }
        return pools;
      }, {} as { [key in SourceName]: BribeToken[] });

      const bribes = await Promise.all(
        Object.keys(bribedPools).map(async sourceName => {
          return await Promise.all(
            bribedPools[sourceName].map(async bribeToken => {
              const activePeriodRaw = await bnJs.Bribe.getActivePeriod(sourceName, bribeToken);
              const activePeriod = parseInt(activePeriodRaw, 16);
              const bribeTokenDecimals = await bnJs.getContract(bribeToken).decimals();
              const bribeTokenSymbol = await bnJs.getContract(bribeToken).symbol();
              const token = new Token(NETWORK_ID, bribeToken, parseInt(bribeTokenDecimals, 16), bribeTokenSymbol);
              const now = new Date().getTime();
              const futureBribes: { timestamp: number; bribe: CurrencyAmount<Token> }[] = [];
              let claimable;

              try {
                claimable = account && (await bnJs.Bribe.claimable(account, sourceName, bribeToken));
              } catch (e) {
                console.error(e);
              }

              for (let i = 0; i < FUTURE_REWARDS_COUNT; i++) {
                const timestamp = i * WEEK_IN_MS + getClosestUnixWeekStart(now).getTime();
                const futureBribe = await bnJs.Bribe.getFutureBribe(sourceName, bribeToken, timestamp * 1000);
                futureBribes.push({
                  timestamp,
                  bribe: CurrencyAmount.fromRawAmount(token, futureBribe),
                });
              }

              return {
                sourceName,
                bribeToken,
                activePeriod,
                claimable: claimable && CurrencyAmount.fromRawAmount(token, claimable),
                futureBribes: futureBribes.sort((a, b) => a.timestamp - b.timestamp),
              } as Bribe;
            }),
          );
        }),
      );

      return bribes
        .filter(bribeTokens => {
          return bribeTokens.filter(
            bribe =>
              bribe.claimable?.greaterThan(0) ||
              bribe.futureBribes.filter(futureBribe => futureBribe.bribe.greaterThan(0)).length,
          ).length;
        })
        .flat();
    },
    {
      keepPreviousData: true,
      refetchInterval: 3000,
      enabled: sourceNames.length > 0,
    },
  );
}
