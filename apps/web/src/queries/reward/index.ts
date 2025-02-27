import { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { BalancedJs, CallData, addresses } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token, XChainId } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';

import { NETWORK_ID } from '@/constants/config';
import { COMBINED_TOKENS_MAP_BY_ADDRESS, ORACLE_PRICED_TOKENS, sICX } from '@/constants/tokens';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useTokenPrices } from '@/queries/backendv2';
import QUERY_KEYS from '@/queries/queryKeys';
import { getTimestampFrom, useBlockDetails, useBlockNumber } from '@/store/application/hooks';
import { useOraclePrices } from '@/store/oracle/hooks';
import { useFlattenedRewardsDistribution } from '@/store/reward/hooks';
import { ICON_XCALL_NETWORK_ID, XToken, bnJs, xTokenMap, xTokenMapBySymbol } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';

export const BATCH_SIZE = 10;

export const useUserCollectedFeesQuery = (start: number = 0, end: number = 0) => {
  const { account } = useIconReact();

  return useQuery<({ [address in string]: CurrencyAmount<Currency> } | null)[] | undefined>({
    queryKey: QUERY_KEYS.Reward.UserCollectedFees(account ?? '', start, end),
    queryFn: async () => {
      if (!account) return;

      const promises: Promise<any>[] = [];
      for (let i = end; i > 1; i -= BATCH_SIZE) {
        const startValue = i - BATCH_SIZE;
        promises.push(bnJs.Dividends.getUserDividends(account, startValue > 0 ? startValue : 0, i));
      }

      let feesArr = await Promise.all(promises);

      feesArr = feesArr.map(fees => {
        if (!fees) return null;
        if (!Object.values(fees).find(value => !BalancedJs.utils.toIcx(value as string).isZero())) return null;

        const t = Object.keys(fees).reduce((prev, address) => {
          const currency = COMBINED_TOKENS_MAP_BY_ADDRESS[address];
          prev[address] = CurrencyAmount.fromFractionalAmount(currency, fees[address], 1);
          return prev;
        }, {});

        return t;
      });

      return feesArr;
    },
    enabled: !!account,
  });
};

export const usePlatformDayQuery = () => {
  return useQuery<number>({
    queryKey: QUERY_KEYS.Reward.PlatformDay,
    queryFn: async () => {
      const res = await bnJs.Governance.getDay();
      return parseInt(res, 16);
    },
  });
};

export const useLPReward = account => {
  const blockNumber = useBlockNumber();

  return useQuery<CurrencyAmount<Token>[] | undefined>({
    queryKey: [QUERY_KEYS.Reward.UserReward(account ?? ''), blockNumber],
    queryFn: async () => {
      if (!account) return;

      const res = await bnJs.Rewards.getRewards(account);

      return Object.entries(res).map(([address, amount]) => {
        const currency = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][address];
        return CurrencyAmount.fromRawAmount(currency, amount as string);
      });
    },
    placeholderData: keepPreviousData,
    enabled: !!account,
  });
};

export const calculateTotal = (balances, rates): BigNumber => {
  return balances.reduce((sum, balance) => {
    sum = sum.plus(new BigNumber(balance.toFixed()).times(rates?.[balance.currency.symbol] || 0));
    return sum;
  }, new BigNumber(0));
};

export const useLPRewards = (): UseQueryResult<Partial<Record<XChainId, CurrencyAmount<Token>[]>>> => {
  const signedWallets = useSignedInWallets();
  const accounts = useMemo(
    () => signedWallets.filter(wallet => wallet.address).map(wallet => `${wallet.xChainId}/${wallet.address}`),
    [signedWallets],
  );

  return useQuery({
    queryKey: ['rewards', accounts],
    queryFn: async () => {
      try {
        if (!accounts || accounts.length === 0) return {};

        // const cds = accounts.map(account => {
        //   return {
        //     target: bnJs.Rewards.address,
        //     method: 'getRewards',
        //     params: [account],
        //   };
        // });

        // console.log('cds', cds);

        // const rawRewards = await bnJs.Multicall.getAggregateData(cds);

        // console.log('rawRewards', rawRewards);

        const allRewards = await Promise.all(
          accounts.map(async account => {
            const xChainId = account.split('/')[0];
            try {
              const res = await bnJs.Rewards.getRewards(account);
              // console.log('res', xChainId, res);
              return { account, res };
            } catch (e) {
              // console.log('error', xChainId, account, e);
              return { account, res: {} };
            }
          }),
        );

        return allRewards.reduce((acc, { account, res }) => {
          const xChainId = account.split('/')[0];
          const rewards = Object.entries(res).map(([address, amount]) => {
            const currency = xTokenMap[ICON_XCALL_NETWORK_ID].find(token => token.address === address);
            return CurrencyAmount.fromRawAmount(currency, amount as string);
          });
          acc[xChainId] = rewards;
          return acc;
        }, {});
      } catch (e) {
        console.log('error', e);
        return {};
      }
    },
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
    enabled: !!accounts && accounts.length > 0,
  });
};
// combine rates api data & oracle data
export const useRatesWithOracle = () => {
  const { data: rates } = useTokenPrices();
  const oraclePrices = useOraclePrices();

  return useMemo(() => {
    if (!rates || !oraclePrices) return;

    const combinedRates = { ...rates };

    Object.keys(oraclePrices).forEach(token => {
      if (!combinedRates[token] || ORACLE_PRICED_TOKENS.includes(token)) {
        combinedRates[token] = oraclePrices[token];
      }
    });

    // add WBTC price
    combinedRates['WBTC'] = combinedRates['BTC'];

    return combinedRates;
  }, [rates, oraclePrices]);
};

export const useIncentivisedPairs = (): UseQueryResult<
  { name: string; id: number; rewards: Fraction; totalStaked: number; externalRewards?: CurrencyAmount<Currency>[] }[],
  Error
> => {
  const { data: rewards } = useFlattenedRewardsDistribution();
  //add supported rewards tokens here
  const additionalRewardTokens = [sICX[NETWORK_ID]];
  //timestamp for PoL should be taken from 1 day old block
  const { data: block } = useBlockDetails(getTimestampFrom(1));

  return useQuery({
    queryKey: ['incentivisedPairs', rewards, block?.number],
    queryFn: async () => {
      if (!rewards || !block?.number) return;

      const lpData = await bnJs.StakedLP.getDataSources();
      const lpSources: string[] = ['sICX/ICX', ...lpData];
      const dataSources: Map<string, { [key in string]: { external_dist: string } }> =
        await bnJs.Rewards.getDataSources(block.number);

      const externalIncentives = Object.entries(dataSources).reduce((acc, [sourceName, sourceData]) => {
        additionalRewardTokens.forEach(token => {
          if (sourceData[token.address]) {
            acc[sourceName] = {
              ...acc[sourceName],
              [token.address]: CurrencyAmount.fromRawAmount(token, sourceData[token.address].external_dist),
            };
          }
        });
        return acc;
      }, {});

      const cds: CallData[] = lpSources.map(source => ({
        target: addresses[NETWORK_ID].stakedLp,
        method: 'getSourceId',
        params: [source],
      }));

      const sourceIDs = await bnJs.Multicall.getAggregateData(cds);

      const sourcesTotalStaked = await Promise.all(
        sourceIDs.map(async (source, index) => await bnJs.StakedLP.totalStaked(index === 0 ? 1 : parseInt(source, 16))),
      );

      return lpSources.map((source, index) => {
        const externalRewards = Object.values(externalIncentives[source] || {});

        return {
          name: source,
          id: index === 0 ? 1 : parseInt(sourceIDs[index], 16),
          rewards: rewards[source],
          externalRewards,
          totalStaked: parseInt((sourcesTotalStaked[index] as string) ?? '0x0', 16),
        };
      });
    },
    enabled: !!rewards && !!block?.number,
    placeholderData: keepPreviousData,
  });
};

export const useICXConversionFee = () => {
  return useQuery({
    queryKey: ['icxConversionFee'],
    queryFn: async () => {
      const feesRaw = await bnJs.Dex.getFees();
      const fee = new Fraction(feesRaw['icx_conversion_fee'], 100);
      return fee;
    },
  });
};
