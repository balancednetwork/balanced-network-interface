import bnJs from '@/bnJs';
import { getTimestampFrom } from '@/pages/PerformanceDetails/utils';
import { useAllPairs, useAllTokensByAddress } from '@/queries/backendv2';
import { useBlockDetails } from '@/queries/blockDetails';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

export const EXTENDED_CHART_COLORS = {
  sICX: '#9D4DF1',
  bnUSD: '#32C9A4',
  BALN: '#2CA9B7',
  AVAX: '#FF394A',
  BNB: '#F0B90B',
  INJ: '#0082FA',
  SUI: '#4DA2FF',
  ETH: '#627EEA',
  BTC: '#f7931a',
  default: '#136aa1',
};

function useNOLPools(): UseQueryResult<string[] | undefined> {
  return useQuery({
    queryKey: ['nolPools'],
    queryFn: async () => {
      const orders = await bnJs.NOL.getOrders();
      return orders.map(order => order.pid);
    },
  });
}

export function useNetworkOwnedLiquidityData(): UseQueryResult<
  | {
      chartData: { label: string; value: BigNumber; fill: string }[];
      tvl: BigNumber;
    }
  | undefined
> {
  const { data: allPairs, isSuccess: allPairsQuerySuccess } = useAllPairs();
  const { data: allTokens, isSuccess: allTokensQuerySuccess } = useAllTokensByAddress();
  const { data: poolIDs, isSuccess: poolIDsQuerySuccess } = useNOLPools();

  return useQuery({
    queryKey: [`networkOwnedLiquidity`],
    queryFn: async () => {
      if (!allPairs || !allTokens || !poolIDs) return;

      const poolDataSets = await Promise.all(
        poolIDs.map(async poolID => {
          const balanceUnstaked = await bnJs.Dex.balanceOf(bnJs.NOL.address, parseInt(poolID, 16));
          const balanceStaked = await bnJs.StakedLP.balanceOf(bnJs.NOL.address, parseInt(poolID, 16));
          const poolStats = await bnJs.Dex.getPoolStats(parseInt(poolID, 16));

          return {
            poolID,
            balance: new BigNumber(balanceUnstaked).plus(new BigNumber(balanceStaked)).div(10 ** 18),
            poolStats,
          };
        }),
      );

      const nolData = poolDataSets.map(dataSet => {
        const networkLP = dataSet.balance;
        const totalLP = new BigNumber(dataSet.poolStats['total_supply']).div(10 ** 18);
        const networkFraction = networkLP.div(totalLP);
        const quoteAmount = new BigNumber(dataSet.poolStats['quote']).div(
          10 ** parseInt(dataSet.poolStats['quote_decimals'], 16),
        );
        const baseAmount = new BigNumber(dataSet.poolStats['base']).div(
          10 ** parseInt(dataSet.poolStats['base_decimals'], 16),
        );
        const quoteValue = quoteAmount.times(allTokens ? allTokens[dataSet.poolStats['quote_token']].price : 1);
        const poolLiquidity = quoteValue.times(2);
        const poolData = {
          id: dataSet.poolID,
          liquidity: poolLiquidity.div(totalLP).times(networkLP),
          pair: allPairs?.find(pair => parseInt(pair.id) === parseInt(dataSet.poolID)),
          DAOQuoteAmount: quoteAmount.times(networkFraction),
          DAOBaseAmount: baseAmount.times(networkFraction),
        };

        return poolData;
      });

      return {
        chartData: nolData
          .map(data => ({
            name: data.pair?.name || 'Unknown',
            value: data.liquidity.toNumber(),
            fill: data.pair?.baseSymbol
              ? EXTENDED_CHART_COLORS[data.pair?.baseSymbol] || EXTENDED_CHART_COLORS['default']
              : EXTENDED_CHART_COLORS['default'],
          }))
          .sort((a, b) => a.value - b.value),
        tvl: nolData.reduce((acc, data) => acc.plus(data.liquidity), new BigNumber(0)),
      };
    },
    placeholderData: keepPreviousData,
    enabled: allPairsQuerySuccess && allTokensQuerySuccess && poolIDsQuerySuccess,
  });
}

export function usePastMonthSupply(): UseQueryResult<any> {
  const { data: blockDetails } = useBlockDetails(getTimestampFrom(30));
  const blockHeight = blockDetails?.number;
  const { data: allTokens } = useAllTokensByAddress();
  const ICXPrice = allTokens?.ICX.price;

  return useQuery({
    queryKey: ['pastMonthSupply'],
    queryFn: async () => {
      if (!blockHeight || !ICXPrice) return;

      try {
        const supplyNow = await bnJs.NOL.getInvestedEmissions();
        const supplyThen = await bnJs.NOL.getInvestedEmissions(blockHeight);

        return new BigNumber(supplyNow)
          .minus(supplyThen || 0)
          .div(10 ** 18)
          .times(ICXPrice);
      } catch (e) {
        console.error('Failed to fetch invested emissions', e);
      }
    },
    placeholderData: keepPreviousData,
    enabled: !!blockHeight && !!ICXPrice,
  });
}
