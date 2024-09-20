import { BalancedJs, CallData, addresses } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import bnJs from '@/bnJs';
import { SUPPORTED_PAIRS } from '@/constants/pairs';
import QUERY_KEYS from '@/constants/queryKeys';
import { SUPPORTED_TOKENS_LIST, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import { getTimestampFrom } from '@/pages/PerformanceDetails/utils';
import { useSupportedCollateralTokens } from '@/store/collateral/hooks';
import { formatUnits } from '@/utils';

import { useEmissions } from '@/sections/BALNSection/queries';
import axios from 'axios';
import { useMemo } from 'react';
import {
  API_ENDPOINT,
  TokenStats,
  useAllCollateralData,
  useAllPairsIncentivisedByName,
  useAllPairsTotal,
  useAllTokensByAddress,
  useTokenPrices,
} from './backendv2';
import { useBlockDetails } from './blockDetails';
import { API_ICON_ENDPOINT } from './historicalData';

const WEIGHT_CONST = 10 ** 18;

export const useBnJsContractQuery = <T>(bnJs: BalancedJs, contract: string, method: string, args: any[]) => {
  return useQuery<T, string>({
    queryKey: QUERY_KEYS.BnJs(contract, method, args),
    queryFn: async () => {
      try {
        return bnJs[contract][method](...args);
      } catch (e) {
        console.log(contract, method);
        throw e;
      }
    },
  });
};

export type RewardDistributionRaw = {
  Base: Map<string, Fraction>;
  Fixed: Map<string, Fraction>;
  Voting: Map<string, Fraction>;
};

export type RewardDistribution = {
  Base: Map<string, Fraction>;
  Fixed: Map<string, Fraction>;
  Voting: Map<string, Fraction>;
};

export type MetaToken = {
  info: Token;
  holders: number;
  name: string;
  symbol: string;
  price: number;
  price_24h: number;
  price_24h_change: number;
  total_supply: number;
  market_cap: number;
  liquidity: number;
  logo_uri?: string;
  address: string;
};

// type DataPeriod = '24h' | '30d';

const PERCENTAGE_DISTRIBUTED_OLD = new BigNumber(0.6);
const PERCENTAGE_DISTRIBUTED = new BigNumber(0.3);
const OLD_FEES_DISTRIBUTION_SWITCH_DATE = new Date('February 22, 2023 05:13:26').getTime() * 1_000;
const ENSHRINEMENT_DATE = new Date('February 19, 2024 05:13:26').getTime() * 1_000;
const FEES_SWITCH_BLOCK_HEIGHT = 62242760;
const ENSHRINEMENT_BLOCK_HEIGHT = 77846897;
const ICX_BURN_RATIO = new BigNumber(0.5);

export const LAUNCH_DAY = 1619398800000000;
export const ONE_DAY = 86400000000;

export const useEarningsDataQuery = (
  start: number = LAUNCH_DAY,
  end: number = new Date().valueOf() * 1_000,
  cacheItem: string = 'earnings-data',
) => {
  const { data: blockStart } = useBlockDetails(start);
  const { data: blockEnd } = useBlockDetails(end);
  const { data: rates } = useTokenPrices();

  return useQuery<
    | {
        income: {
          loans: BigNumber;
          fund: BigNumber;
          swaps: { [key: string]: { amount: BigNumber; value: BigNumber } };
        };
        expenses: { [key: string]: { amount: BigNumber; value: BigNumber } };
        feesDistributed: BigNumber;
        icxBurned: BigNumber;
        icxBurnFund: { [key: string]: { amount: BigNumber; value: BigNumber } };
      }
    | undefined
  >({
    queryKey: [cacheItem, blockStart?.number, blockEnd?.number, rates && Object.keys(rates).length],
    queryFn: async () => {
      async function getEarnings(
        blockStart: number,
        blockEnd: number,
        rates: { [key: string]: BigNumber },
      ): Promise<{
        loans: BigNumber;
        fund: BigNumber;
        swaps: { [key: string]: { amount: BigNumber; value: BigNumber } };
      }> {
        const loanFeesStart = await bnJs.FeeHandler.getLoanFeesAccrued(blockStart);
        const loanFeesEnd = await bnJs.FeeHandler.getLoanFeesAccrued(blockEnd);

        const fundFeesStart = await bnJs.FeeHandler.getStabilityFundFeesAccrued(blockStart);
        const fundFeesEnd = await bnJs.FeeHandler.getStabilityFundFeesAccrued(blockEnd);

        //swap fees
        const bnUSDFeesStart = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.bnUSD.address, blockStart);
        const bnUSDFeesEnd = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.bnUSD.address, blockEnd);

        const sICXFeesStart = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.sICX.address, blockStart);
        const sICXFeesEnd = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.sICX.address, blockEnd);

        const balnFeesStart = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.BALN.address, blockStart);
        const balnFeesEnd = await bnJs.FeeHandler.getSwapFeesAccruedByToken(bnJs.BALN.address, blockEnd);

        const bnUSDIncome = new BigNumber(formatUnits(bnUSDFeesEnd)).minus(new BigNumber(formatUnits(bnUSDFeesStart)));
        const sICXIncome = new BigNumber(formatUnits(sICXFeesEnd)).minus(new BigNumber(formatUnits(sICXFeesStart)));
        const balnIncome = new BigNumber(formatUnits(balnFeesEnd)).minus(new BigNumber(formatUnits(balnFeesStart)));
        const loansIncome = new BigNumber(formatUnits(loanFeesEnd)).minus(new BigNumber(formatUnits(loanFeesStart)));
        const fundIncome = new BigNumber(formatUnits(fundFeesEnd)).minus(new BigNumber(formatUnits(fundFeesStart)));

        return {
          loans: loansIncome,
          fund: fundIncome,
          swaps: {
            BALN: {
              amount: balnIncome,
              value: balnIncome.times(rates['BALN']),
            },
            bnUSD: {
              amount: bnUSDIncome,
              value: bnUSDIncome,
            },
            sICX: {
              amount: sICXIncome,
              value: sICXIncome.times(rates['sICX']),
            },
          },
        };
      }
      if (blockStart?.number && blockEnd?.number && rates) {
        if (blockEnd.timestamp < ENSHRINEMENT_DATE) {
          //all calcs happen before enshrinement
          if (
            blockStart.timestamp < OLD_FEES_DISTRIBUTION_SWITCH_DATE &&
            OLD_FEES_DISTRIBUTION_SWITCH_DATE < blockEnd.timestamp
          ) {
            // Split earning periods to before and after distribution ratio switch
            try {
              const earningsBefore = await getEarnings(blockStart.number, FEES_SWITCH_BLOCK_HEIGHT, rates);
              const earningsAfter = await getEarnings(FEES_SWITCH_BLOCK_HEIGHT + 1, blockEnd.number, rates);

              const expenses = {
                BALN: {
                  amount: earningsBefore.swaps.BALN.amount
                    .times(PERCENTAGE_DISTRIBUTED_OLD)
                    .plus(earningsAfter.swaps.BALN.amount.times(PERCENTAGE_DISTRIBUTED)),
                  value: earningsBefore.swaps.BALN.value
                    .times(PERCENTAGE_DISTRIBUTED_OLD)
                    .plus(earningsAfter.swaps.BALN.value.times(PERCENTAGE_DISTRIBUTED)),
                },
                bnUSD: {
                  amount: earningsBefore.swaps.bnUSD.amount
                    .plus(earningsBefore.loans)
                    .plus(earningsBefore.fund)
                    .times(PERCENTAGE_DISTRIBUTED_OLD)
                    .plus(
                      earningsAfter.swaps.bnUSD.amount
                        .plus(earningsAfter.loans)
                        .plus(earningsAfter.fund)
                        .times(PERCENTAGE_DISTRIBUTED),
                    ),
                  value: earningsBefore.swaps.bnUSD.value
                    .plus(earningsBefore.loans)
                    .plus(earningsBefore.fund)
                    .times(PERCENTAGE_DISTRIBUTED_OLD)
                    .plus(
                      earningsAfter.swaps.bnUSD.value
                        .plus(earningsAfter.loans)
                        .plus(earningsAfter.fund)
                        .times(PERCENTAGE_DISTRIBUTED),
                    ),
                },
                sICX: {
                  amount: earningsBefore.swaps.sICX.amount
                    .times(PERCENTAGE_DISTRIBUTED_OLD)
                    .plus(earningsAfter.swaps.sICX.amount.times(PERCENTAGE_DISTRIBUTED)),
                  value: earningsBefore.swaps.sICX.value
                    .times(PERCENTAGE_DISTRIBUTED_OLD)
                    .plus(earningsAfter.swaps.sICX.value.times(PERCENTAGE_DISTRIBUTED)),
                },
              };

              return {
                income: {
                  loans: earningsBefore.loans.plus(earningsAfter.loans),
                  fund: earningsBefore.fund.plus(earningsAfter.fund),
                  swaps: {
                    BALN: {
                      amount: earningsBefore.swaps.BALN.amount.plus(earningsAfter.swaps.BALN.amount),
                      value: earningsBefore.swaps.BALN.value.plus(earningsAfter.swaps.BALN.value),
                    },
                    bnUSD: {
                      amount: earningsBefore.swaps.bnUSD.amount.plus(earningsAfter.swaps.bnUSD.amount),
                      value: earningsBefore.swaps.bnUSD.value.plus(earningsAfter.swaps.bnUSD.value),
                    },
                    sICX: {
                      amount: earningsBefore.swaps.sICX.amount.plus(earningsAfter.swaps.sICX.amount),
                      value: earningsBefore.swaps.sICX.value.plus(earningsAfter.swaps.sICX.value),
                    },
                  },
                },
                expenses,
                feesDistributed: expenses.BALN.value.plus(expenses.bnUSD.value).plus(expenses.sICX.value),
                icxBurnFund: {
                  BALN: {
                    amount: new BigNumber(0),
                    value: new BigNumber(0),
                  },
                  bnUSD: {
                    amount: new BigNumber(0),
                    value: new BigNumber(0),
                  },
                  sICX: {
                    amount: new BigNumber(0),
                    value: new BigNumber(0),
                  },
                },
                icxBurned: new BigNumber(0),
              };
            } catch (e) {
              console.error('Error calculating dao earnings: ', e);
            }
          } else {
            //Calculate earning periods without distribution ratio switch
            try {
              const earnings = await getEarnings(blockStart.number, blockEnd.number, rates);

              const expenses = {
                BALN: {
                  amount: earnings.swaps.BALN.amount.times(PERCENTAGE_DISTRIBUTED),
                  value: earnings.swaps.BALN.value.times(PERCENTAGE_DISTRIBUTED),
                },
                bnUSD: {
                  amount: earnings.swaps.bnUSD.amount
                    .plus(earnings.loans)
                    .plus(earnings.fund)
                    .times(PERCENTAGE_DISTRIBUTED),
                  value: earnings.swaps.bnUSD.amount
                    .plus(earnings.loans)
                    .plus(earnings.fund)
                    .times(PERCENTAGE_DISTRIBUTED),
                },
                sICX: {
                  amount: earnings.swaps.sICX.amount.times(PERCENTAGE_DISTRIBUTED),
                  value: earnings.swaps.sICX.value.times(PERCENTAGE_DISTRIBUTED),
                },
              };

              return {
                income: earnings,
                expenses,
                feesDistributed: expenses.BALN.value.plus(expenses.bnUSD.value).plus(expenses.sICX.value),
                icxBurnFund: {
                  BALN: {
                    amount: new BigNumber(0),
                    value: new BigNumber(0),
                  },
                  bnUSD: {
                    amount: new BigNumber(0),
                    value: new BigNumber(0),
                  },
                  sICX: {
                    amount: new BigNumber(0),
                    value: new BigNumber(0),
                  },
                },
                icxBurned: new BigNumber(0),
              };
            } catch (e) {
              console.error('Error calculating dao earnings: ', e);
            }
          }
        } else if (blockEnd.timestamp >= ENSHRINEMENT_DATE && blockStart.timestamp < ENSHRINEMENT_DATE) {
          //calcs need to be split based on enshrinement date
          try {
            const earningsBefore = await getEarnings(blockStart.number, ENSHRINEMENT_BLOCK_HEIGHT, rates);
            const earningsAfter = await getEarnings(ENSHRINEMENT_BLOCK_HEIGHT + 1, blockEnd.number, rates);

            const expenses = {
              BALN: {
                amount: earningsBefore.swaps.BALN.amount
                  .times(PERCENTAGE_DISTRIBUTED)
                  .plus(earningsAfter.swaps.BALN.amount.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED)),
                value: earningsBefore.swaps.BALN.value
                  .times(PERCENTAGE_DISTRIBUTED)
                  .plus(earningsAfter.swaps.BALN.value.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED)),
              },
              bnUSD: {
                amount: earningsBefore.swaps.bnUSD.amount
                  .plus(earningsBefore.loans)
                  .plus(earningsBefore.fund)
                  .times(PERCENTAGE_DISTRIBUTED)
                  .plus(
                    earningsAfter.swaps.bnUSD.amount
                      .plus(earningsAfter.loans)
                      .plus(earningsAfter.fund)
                      .times(ICX_BURN_RATIO)
                      .times(PERCENTAGE_DISTRIBUTED),
                  ),
                value: earningsBefore.swaps.bnUSD.value
                  .plus(earningsBefore.loans)
                  .plus(earningsBefore.fund)
                  .times(PERCENTAGE_DISTRIBUTED)
                  .plus(
                    earningsAfter.swaps.bnUSD.value
                      .plus(earningsAfter.loans)
                      .plus(earningsAfter.fund)
                      .times(ICX_BURN_RATIO)
                      .times(PERCENTAGE_DISTRIBUTED),
                  ),
              },
              sICX: {
                amount: earningsBefore.swaps.sICX.amount
                  .times(PERCENTAGE_DISTRIBUTED)
                  .plus(earningsAfter.swaps.sICX.amount.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED)),
                value: earningsBefore.swaps.sICX.value
                  .times(PERCENTAGE_DISTRIBUTED)
                  .plus(earningsAfter.swaps.sICX.value.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED)),
              },
            };

            const icxBurnFund = {
              BALN: {
                amount: earningsAfter.swaps.BALN.amount.times(ICX_BURN_RATIO),
                value: earningsAfter.swaps.BALN.value.times(ICX_BURN_RATIO),
              },
              bnUSD: {
                amount: earningsAfter.swaps.bnUSD.amount
                  .plus(earningsAfter.loans)
                  .plus(earningsAfter.fund)
                  .times(ICX_BURN_RATIO),
                value: earningsAfter.swaps.bnUSD.value
                  .plus(earningsAfter.loans)
                  .plus(earningsAfter.fund)
                  .times(ICX_BURN_RATIO),
              },
              sICX: {
                amount: earningsAfter.swaps.sICX.amount.times(ICX_BURN_RATIO),
                value: earningsAfter.swaps.sICX.value.times(ICX_BURN_RATIO),
              },
            };

            return {
              income: {
                loans: earningsBefore.loans.plus(earningsAfter.loans),
                fund: earningsBefore.fund.plus(earningsAfter.fund),
                swaps: {
                  BALN: {
                    amount: earningsBefore.swaps.BALN.amount.plus(earningsAfter.swaps.BALN.amount),
                    value: earningsBefore.swaps.BALN.value.plus(earningsAfter.swaps.BALN.value),
                  },
                  bnUSD: {
                    amount: earningsBefore.swaps.bnUSD.amount.plus(earningsAfter.swaps.bnUSD.amount),
                    value: earningsBefore.swaps.bnUSD.value.plus(earningsAfter.swaps.bnUSD.value),
                  },
                  sICX: {
                    amount: earningsBefore.swaps.sICX.amount.plus(earningsAfter.swaps.sICX.amount),
                    value: earningsBefore.swaps.sICX.value.plus(earningsAfter.swaps.sICX.value),
                  },
                },
              },
              expenses,
              icxBurnFund,
              feesDistributed: expenses.BALN.value.plus(expenses.bnUSD.value).plus(expenses.sICX.value),
              icxBurned: icxBurnFund.BALN.value.plus(icxBurnFund.bnUSD.value).plus(icxBurnFund.sICX.value),
            };
          } catch (e) {
            console.error('Error calculating dao earnings: ', e);
          }
        } else {
          //all calcs happen after enshrinement
          try {
            const earnings = await getEarnings(blockStart.number, blockEnd.number, rates);

            const icxBurnFund = {
              BALN: {
                amount: earnings.swaps.BALN.amount.times(ICX_BURN_RATIO),
                value: earnings.swaps.BALN.value.times(ICX_BURN_RATIO),
              },
              bnUSD: {
                amount: earnings.swaps.bnUSD.amount.plus(earnings.loans).plus(earnings.fund).times(ICX_BURN_RATIO),
                value: earnings.swaps.bnUSD.amount.plus(earnings.loans).plus(earnings.fund).times(ICX_BURN_RATIO),
              },
              sICX: {
                amount: earnings.swaps.sICX.amount.times(ICX_BURN_RATIO),
                value: earnings.swaps.sICX.value.times(ICX_BURN_RATIO),
              },
            };

            const expenses = {
              BALN: {
                amount: earnings.swaps.BALN.amount.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED),
                value: earnings.swaps.BALN.value.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED),
              },
              bnUSD: {
                amount: earnings.swaps.bnUSD.amount
                  .plus(earnings.loans)
                  .plus(earnings.fund)
                  .times(ICX_BURN_RATIO)
                  .times(PERCENTAGE_DISTRIBUTED),
                value: earnings.swaps.bnUSD.amount
                  .plus(earnings.loans)
                  .plus(earnings.fund)
                  .times(ICX_BURN_RATIO)
                  .times(PERCENTAGE_DISTRIBUTED),
              },
              sICX: {
                amount: earnings.swaps.sICX.amount.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED),
                value: earnings.swaps.sICX.value.times(ICX_BURN_RATIO).times(PERCENTAGE_DISTRIBUTED),
              },
            };

            return {
              income: earnings,
              expenses,
              icxBurnFund,
              feesDistributed: expenses.BALN.value.plus(expenses.bnUSD.value).plus(expenses.sICX.value),
              icxBurned: icxBurnFund.BALN.value.plus(icxBurnFund.bnUSD.value).plus(icxBurnFund.sICX.value),
            };
          } catch (e) {
            console.error('Error calculating dao earnings: ', e);
          }
        }
      }
    },

    enabled: Boolean(blockStart && blockEnd && rates),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: undefined,
    refetchIntervalInBackground: undefined,
  });
};

export const useStatsTVL = () => {
  const { data: pairsTotal } = useAllPairsTotal();
  const { data: collateralInfo } = useCollateralInfo();

  if (pairsTotal && collateralInfo) {
    return pairsTotal.tvl + collateralInfo.collateralData.current.total.value;
  }
};

export const usePlatformDayQuery = () => {
  return useQuery<number>({
    queryKey: [QUERY_KEYS.PlatformDay],
    queryFn: async () => {
      const res = await bnJs.Governance.getDay();
      return parseInt(res, 16);
    },
  });
};

export const useOverviewInfo = () => {
  const { data: allTokens } = useAllTokensByAddress();
  const tvl = useStatsTVL();

  const balnPrice = allTokens && allTokens[bnJs.BALN.address].price;
  const BALNMarketCap =
    allTokens && new BigNumber(allTokens[bnJs.BALN.address].price * allTokens[bnJs.BALN.address].total_supply);

  const { data: platformDay } = usePlatformDayQuery();
  const earningsDataQuery = useEarningsDataQuery(getTimestampFrom(30), getTimestampFrom(0));

  //bBALN apy
  const assumedYearlyDistribution = earningsDataQuery?.data?.feesDistributed.times(12);
  const bBALNSupplyQuery = useBnJsContractQuery<string>(bnJs, 'BBALN', 'totalSupply', []);
  const bBALNSupply = bBALNSupplyQuery.isSuccess && new BigNumber(formatUnits(bBALNSupplyQuery.data));
  const bBALNAPY =
    assumedYearlyDistribution &&
    bBALNSupply &&
    balnPrice &&
    assumedYearlyDistribution.div(bBALNSupply.times(balnPrice));

  const previousChunkAmount = 1000;

  const earnedPastMonth =
    earningsDataQuery.isSuccess && earningsDataQuery.data
      ? earningsDataQuery.data.income.loans
          .plus(earningsDataQuery.data.income.fund)
          // .plus(earningsDataQuery.data.income.liquidity.value)
          // .plus(
          //   Object.values(earningsDataQuery.data.income.fees).reduce(
          //     (total, fee) => total.plus(fee.value),
          //     new BigNumber(0),
          //   ),
          // )
          .plus(
            Object.values(earningsDataQuery.data.income.swaps).reduce(
              (total, swap) => total.plus(swap.value),
              new BigNumber(0),
            ),
          )
      : undefined;

  return {
    TVL: tvl,
    BALNMarketCap: BALNMarketCap?.integerValue().toNumber(),
    earned: earnedPastMonth?.toNumber(),
    platformDay: platformDay,
    monthlyFeesTotal: earningsDataQuery?.data?.feesDistributed,
    bBALNAPY: bBALNAPY,
    balnPrice: new BigNumber(balnPrice || 0),
    previousChunk:
      bBALNSupply &&
      earningsDataQuery?.data &&
      new BigNumber(previousChunkAmount).dividedBy(bBALNSupply).times(earningsDataQuery?.data?.feesDistributed),
    previousChunkAmount: previousChunkAmount,
  };
};

export const useGovernanceInfo = () => {
  const { data: platformDay } = usePlatformDayQuery();
  const proposalSampleSize = 20;

  return useQuery({
    queryKey: [`governanceOverview-${platformDay ? platformDay : 0}`],
    queryFn: async () => {
      if (platformDay) {
        const eligibleVotersRaw = await bnJs.BBALN.activeUsersCount();
        const eligibleVoters = parseInt(eligibleVotersRaw);
        const totalProposalsRaw = await bnJs.Governance.getTotalProposal();
        const totalProposals = parseInt(totalProposalsRaw);
        const latestProposals = await bnJs.Governance.getProposals(
          totalProposals - (proposalSampleSize - 1),
          proposalSampleSize,
        );
        const activeProposals = latestProposals.filter(
          proposal =>
            platformDay &&
            proposal.status === 'Active' &&
            parseInt(proposal['start day'], 16) <= platformDay &&
            parseInt(proposal['end day'], 16) > platformDay,
        ).length;

        const participations = latestProposals
          .filter(proposal => proposal.status !== 'Active' && proposal.status !== 'Cancelled')
          .sort((a, b) => b.id - a.id)
          .splice(0, 10)
          .map(proposal => {
            const votedYes = parseInt(proposal['for'], 16);
            const votedNo = parseInt(proposal['against'], 16);
            return (votedYes + votedNo) / 10 ** 18;
          })
          .filter(participation => participation > 0);

        const participationRate =
          participations.reduce((total, participation) => total + participation, 0) / participations.length;

        return {
          activeProposals,
          totalProposals,
          participationRate,
          eligibleVoters,
        };
      }
    },
  });
};

export function useLatestProposals() {
  return useQuery({
    queryKey: [`latestProposals`],
    queryFn: async () => {
      const totalProposalsRaw = await bnJs.Governance.getTotalProposal();
      const totalProposals = parseInt(totalProposalsRaw);
      const latestProposals = await bnJs.Governance.getProposals(totalProposals - 9, 10);
      return latestProposals
        .filter(proposal => proposal.status !== 'Cancelled')
        .sort((a, b) => b.id - a.id)
        .splice(0, 3);
    },
  });
}

export function useRewardsPercentDistribution(): UseQueryResult<RewardDistribution, Error> {
  return useQuery({
    queryKey: ['rewardDistribution'],
    queryFn: async () => {
      const data: RewardDistributionRaw = await bnJs.Rewards.getDistributionPercentages();

      return {
        Base: Object.keys(data.Base).reduce((distributions, item) => {
          try {
            distributions[item] = new Fraction(data.Base[item], WEIGHT_CONST);
          } catch (e) {
            console.error(e);
          } finally {
            return distributions;
          }
        }, {}),
        Fixed: Object.keys(data.Fixed).reduce((distributions, item) => {
          try {
            distributions[item] = new Fraction(data.Fixed[item], WEIGHT_CONST);
          } catch (e) {
            console.error(e);
          } finally {
            return distributions;
          }
        }, {}),
        Voting: Object.keys(data.Voting).reduce((distributions, item) => {
          try {
            distributions[item] = new Fraction(data.Voting[item], WEIGHT_CONST);
          } catch (e) {
            console.error(e);
          } finally {
            return distributions;
          }
        }, {}),
      };
    },
  });
}

export function useFlattenedRewardsDistribution(): UseQueryResult<Map<string, Fraction>, Error> {
  const { data: distribution } = useRewardsPercentDistribution();

  return useQuery({
    queryKey: ['flattenedDistribution', distribution],
    queryFn: () => {
      if (!distribution) return new Map();

      return Object.values(distribution).reduce((flattened, dist) => {
        return Object.keys(dist).reduce((flattened, item) => {
          if (Object.keys(flattened).indexOf(item) >= 0) {
            flattened[item] = flattened[item].add(dist[item]);
          } else {
            flattened[item] = dist[item];
          }
          return flattened;
        }, flattened);
      }, {});
    },
    placeholderData: keepPreviousData,
  });
}

export const useIncentivisedPairs = (): UseQueryResult<
  { name: string; id: number; rewards: Fraction; totalStaked: number }[],
  Error
> => {
  const { data: rewards } = useFlattenedRewardsDistribution();

  return useQuery({
    queryKey: ['incentivisedPairs', rewards],
    queryFn: async () => {
      if (rewards) {
        const lpData = await bnJs.StakedLP.getDataSources();
        const lpSources: string[] = ['sICX/ICX', ...lpData];

        const cds: CallData[] = lpSources.map(source => ({
          target: addresses[1].stakedLp,
          method: 'getSourceId',
          params: [source],
        }));

        const sourceIDs = await bnJs.Multicall.getAggregateData(cds);

        const sourcesTotalStaked = await Promise.all(
          sourceIDs.map(
            async (source, index) => await bnJs.StakedLP.totalStaked(index === 0 ? 1 : parseInt(source, 16)),
          ),
        );

        return lpSources.map((source, index) => ({
          name: source,
          id: index === 0 ? 1 : parseInt(sourceIDs[index], 16),
          rewards: rewards[source],
          totalStaked: parseInt((sourcesTotalStaked[index] as string) ?? '0x0', 16),
        }));
      }
    },
    placeholderData: keepPreviousData,
  });
};

export const useStakingAPR = (): UseQueryResult<BigNumber | undefined> => {
  return useQuery({
    queryKey: ['icxStakingAPR'],
    queryFn: async () => {
      const stakingData = await axios.get(`${API_ICON_ENDPOINT}governance/stats/apy/time?limit=100`);

      const stakingAPY = stakingData ? new BigNumber(stakingData.data[0].staking_apy || 0).div(100) : undefined;

      return stakingAPY;
    },
    placeholderData: keepPreviousData,
  });
};

export const useCollateralInfo = () => {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;
  const rateQuery = useBnJsContractQuery<string>(bnJs, 'Staking', 'getTodayRate', []);
  const rate = rateQuery.isSuccess ? BalancedJs.utils.toIcx(rateQuery.data) : null;
  const { data: collateralData, isSuccess: collateralDataQuerySuccess } = useAllCollateralData();

  return useQuery({
    queryKey: [`collateralInfoAt${now}`],
    queryFn: async () => {
      if (collateralData) {
        return {
          collateralData,
          rate: rate?.toNumber(),
        };
      }
    },
    placeholderData: keepPreviousData,
    enabled: collateralDataQuerySuccess,
  });
};

export const useLoanInfo = () => {
  const totalBnUSDQuery = useBnJsContractQuery<string>(bnJs, 'bnUSD', 'totalSupply', []);
  const totalBnUSD = totalBnUSDQuery.isSuccess ? BalancedJs.utils.toIcx(totalBnUSDQuery.data) : null;
  const { data: balnDistribution } = useFlattenedRewardsDistribution();
  const loansBalnAllocation = balnDistribution?.['Loans'] || new Fraction(0);
  const { data: dailyEmissions } = useEmissions();

  const dailyRewards = useMemo(() => {
    if (!dailyEmissions || !loansBalnAllocation) return null;
    return dailyEmissions.times(new BigNumber(loansBalnAllocation.toFixed(18)));
  }, [dailyEmissions, loansBalnAllocation]);

  const { data: tokenPrices } = useTokenPrices();

  const loansAPY =
    dailyRewards && totalBnUSD && tokenPrices
      ? dailyRewards.times(365).times(tokenPrices['BALN']).div(totalBnUSD.times(tokenPrices['bnUSD']))
      : null;

  const borrowersQuery = useBnJsContractQuery<string>(bnJs, 'Loans', 'borrowerCount', []);
  const borrowers = borrowersQuery.isSuccess ? new BigNumber(borrowersQuery.data) : null;

  return {
    totalBnUSD: totalBnUSD?.toNumber(),
    loansAPY: loansAPY?.toNumber(),
    dailyRewards: dailyRewards?.toNumber(),
    borrowers: borrowers?.toNumber(),
  };
};

export const useAllPairsParticipantQuery = () => {
  return useQuery<{ [key: string]: number }>({
    queryKey: ['useAllPairsParticipantQuery'],
    queryFn: async () => {
      const res: Array<string> = await Promise.all(SUPPORTED_PAIRS.map(pair => bnJs.Dex.totalDexAddresses(pair.id)));

      const t = {};
      SUPPORTED_PAIRS.forEach((pair, index) => {
        t[pair.name] = parseInt(res[index]);
      });

      return t;
    },
  });
};

export const useWhitelistedTokensList = () => {
  return useQuery<string[]>({
    queryKey: ['whitelistedTokens'],
    queryFn: async () => {
      return await bnJs.StabilityFund.getAcceptedTokens();
    },
  });
};

export function useFundLimits(): UseQueryResult<{ [key: string]: CurrencyAmount<Token> }> {
  const whitelistedTokenAddressesQuery = useWhitelistedTokensList();
  const whitelistedTokenAddresses = whitelistedTokenAddressesQuery.data ?? [];

  return useQuery<{ [key: string]: CurrencyAmount<Token> }>({
    queryKey: [`useFundLimitsQuery`, whitelistedTokenAddresses.length],
    queryFn: async () => {
      const cds: CallData[] = whitelistedTokenAddresses.map(address => {
        return {
          target: bnJs.StabilityFund.address,
          method: 'getLimit',
          params: [address],
        };
      });

      const data: string[] = await bnJs.Multicall.getAggregateData(cds);

      const limits = {};
      data.forEach((limit, index) => {
        const address = whitelistedTokenAddresses[index];
        const token = SUPPORTED_TOKENS_LIST.filter(token => token.address === address)[0];
        limits[address] = CurrencyAmount.fromRawAmount(token, limit);
      });

      return limits;
    },
  });
}

export function useFundInfo() {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: blockThen, isSuccess: blockHeightSuccess } = useBlockDetails(
    new Date(now).setDate(new Date().getDate() - 30),
  );

  return useQuery({
    queryKey: ['fundInfo'],
    queryFn: async () => {
      const feeIn = await bnJs.StabilityFund.getFeeIn();
      const feeOut = await bnJs.StabilityFund.getFeeOut();

      const fundFeesNow = await bnJs.FeeHandler.getStabilityFundFeesAccrued();
      const fundFeesThen = await bnJs.FeeHandler.getStabilityFundFeesAccrued(blockThen?.number);

      return {
        feeIn: Number(formatUnits(feeIn, 18, 2)),
        feeOut: Number(formatUnits(feeOut, 18, 2)),
        feesGenerated: new BigNumber(formatUnits(fundFeesNow))
          .minus(new BigNumber(formatUnits(fundFeesThen)))
          .toNumber(),
      };
    },
    enabled: blockHeightSuccess,
    placeholderData: keepPreviousData,
  });
}

type Source = {
  balance: BigNumber;
  supply: BigNumber;
  workingBalance: BigNumber;
  workingSupply: BigNumber;
  apy: number;
};

type DaoBBALNData = {
  BBALNTotalSupply: BigNumber;
  BBALNDaoHolding: BigNumber;
  BALNDaoLocked: BigNumber;
  BALNLockEnd: Date;
  DAOSources: Source[];
  DAORewards: { baln: CurrencyAmount<Token>; fees: Map<string, CurrencyAmount<Token>> };
};

export function useDaoBBALNData(): UseQueryResult<DaoBBALNData, Error> {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;
  const feesDistributedIn = [bnJs.sICX.address, bnJs.bnUSD.address, bnJs.BALN.address];
  const { data: allPairs, isSuccess: allPairsQuerySuccess } = useAllPairsIncentivisedByName();

  return useQuery({
    queryKey: [`daoBBALNData${now}`],
    queryFn: async () => {
      const daoBBALNData = {};

      //total bBALN supply
      const BBALNTotalSupplyRaw = await bnJs.BBALN.totalSupply();
      const BBALNTotalSupply = new BigNumber(formatUnits(BBALNTotalSupplyRaw));
      daoBBALNData['BBALNTotalSupply'] = BBALNTotalSupply;

      //dao bBALN holding
      const BBALNDaoHoldingRaw = await bnJs.BBALN.balanceOf(bnJs.DAOFund.address);
      const BBALNDaoHolding = new BigNumber(formatUnits(BBALNDaoHoldingRaw));
      daoBBALNData['BBALNDaoHolding'] = BBALNDaoHolding;

      //dao BALN locked
      const BALNDaoLockedRaw = await bnJs.BBALN.getLocked(bnJs.DAOFund.address);
      const BALNDaoLocked = new BigNumber(formatUnits(BALNDaoLockedRaw.amount));
      daoBBALNData['BALNDaoLocked'] = BALNDaoLocked;

      //dao lock end
      const BALNLockEnd = new Date(parseInt(BALNDaoLockedRaw.end, 16) / 1000);
      daoBBALNData['BALNLockEnd'] = BALNLockEnd;

      //dao sources
      const DAOSourcesRaw = await bnJs.Rewards.getBoostData(bnJs.DAOFund.address);
      const DAOSources = Object.keys(DAOSourcesRaw).reduce((sources, sourceName) => {
        if (new BigNumber(DAOSourcesRaw[sourceName].balance).isGreaterThan(0)) {
          const workingBalance = new BigNumber(DAOSourcesRaw[sourceName].workingBalance);
          const balance = new BigNumber(DAOSourcesRaw[sourceName].balance);
          const boost = workingBalance.dividedBy(balance);
          const feesApy = allPairs && allPairs[sourceName] ? allPairs[sourceName].feesApy || 0 : 0;
          const balnApy = allPairs && allPairs[sourceName] ? allPairs[sourceName].balnApy || 0 : 0;

          const apy = boost.times(balnApy).plus(feesApy).times(100).dp(2);

          sources[sourceName] = {
            balance: balance,
            supply: new BigNumber(DAOSourcesRaw[sourceName].supply),
            workingBalance: workingBalance,
            workingSupply: new BigNumber(DAOSourcesRaw[sourceName].workingSupply),
            apy: apy,
          };
        }
        return sources;
      }, {});
      daoBBALNData['DAOSources'] = DAOSources;

      //unclaimed dao network fees
      const rewardsFeesRaw = await bnJs.Dividends.getUnclaimedDividends(bnJs.DAOFund.address);
      const rewardsFees: { [address in string]: CurrencyAmount<Token> } = feesDistributedIn.reduce((fees, address) => {
        const currency = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address];
        fees[address] = CurrencyAmount.fromRawAmount(currency, rewardsFeesRaw[address]);
        return fees;
      }, {});
      daoBBALNData['DAORewards'] = {};
      daoBBALNData['DAORewards']['fees'] = rewardsFees;

      //unclaimed baln rewards
      const rewardsBalnRaw = await bnJs.Rewards.getBalnHolding(bnJs.DAOFund.address);
      const rewardsBaln = CurrencyAmount.fromRawAmount(
        SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.BALN.address],
        rewardsBalnRaw,
      );
      daoBBALNData['DAORewards']['baln'] = rewardsBaln;

      return daoBBALNData as DaoBBALNData;
    },
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
    refetchInterval: undefined,
    enabled: allPairsQuerySuccess,
  });
}

export function useBorrowersInfo() {
  const { data: collateralTokens, isSuccess: collateralTokensSuccess } = useSupportedCollateralTokens();

  return useQuery<{ [key in string]: number }, Error>({
    queryKey: [`borrowersInfo`],
    queryFn: async () => {
      if (collateralTokens) {
        const collateralSymbols = Object.keys(collateralTokens);
        const collateralAddresses = Object.values(collateralTokens);

        const cds: CallData[] = collateralAddresses.map(address => ({
          target: bnJs.Loans.address,
          method: 'getBorrowerCount',
          params: [address],
        }));

        const data = await bnJs.Multicall.getAggregateData(cds);

        let total = 0;
        const result = data.reduce(
          (borrowersInfo, item, index) => {
            const borrowers = parseInt(item, 16);
            borrowersInfo[collateralSymbols[index]] = borrowers;
            total += borrowers;
            return borrowersInfo;
          },
          {} as { [key in string]: number },
        );

        result['total'] = total;

        return result;
      }
    },
    placeholderData: keepPreviousData,
    enabled: collateralTokensSuccess,
  });
}

type WithdrawalsFloorDataType = {
  assetFloorData: {
    floor: BigNumber;
    percentageFloor: BigNumber;
    floorTimeDecayInHours: BigNumber;
    current: BigNumber;
    token: TokenStats;
  }[];
};
type StabilityFundWithdrawalsFloorDataType = {
  percentageFloor: BigNumber;
  floorTimeDecayInHours: BigNumber;
  assetFloorData: {
    floor: BigNumber;
    current: BigNumber;
    token: TokenStats;
  }[];
};

export function useWithdrawalsFloorCollateralData(): UseQueryResult<WithdrawalsFloorDataType> {
  const { data: collateralTokens, isSuccess: collateralTokensSuccess } = useSupportedCollateralTokens();
  const { data: allTokens, isSuccess: tokensSuccess } = useAllTokensByAddress();

  return useQuery({
    queryKey: [`withdrawalsFloorData-${collateralTokens && Object.keys(collateralTokens).length}-tokens`],
    queryFn: async () => {
      if (collateralTokens && allTokens) {
        const collateralAddresses = Object.values(collateralTokens);

        const cdsArray: CallData[][] = [
          ...collateralAddresses.map(address => {
            return [
              {
                target: bnJs.Loans.address,
                method: 'getCurrentFloor',
                params: [address],
              },
              {
                target: bnJs.Loans.address,
                method: 'getFloorPercentage',
                params: [address],
              },
              {
                target: bnJs.Loans.address,
                method: 'getTimeDelayMicroSeconds',
                params: [address],
              },
              {
                target: address,
                method: 'balanceOf',
                params: [bnJs.Loans.address],
              },
            ];
          }),
        ];

        const data = await Promise.all(
          cdsArray.map(async (cds, index) => {
            return await bnJs.Multicall.getAggregateData(cds);
          }),
        );

        const assetFloorData = data
          .map((assetDataSet, index) => {
            const token = allTokens[collateralAddresses[index]];
            return {
              floor: new BigNumber(assetDataSet[0]).div(10 ** token?.decimals),
              percentageFloor: new BigNumber(assetDataSet[1]).div(10000),
              floorTimeDecayInHours: new BigNumber(assetDataSet[2]).div(1000 * 1000 * 60 * 60),
              current: new BigNumber(assetDataSet[3]).div(10 ** token?.decimals),
              token,
            };
          })
          .filter(item => item.floor.isGreaterThan(0))
          .sort((a, b) => (a.floor.isGreaterThan(b.floor) ? -1 : 1));

        return {
          assetFloorData,
        };
      }
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
    enabled: collateralTokensSuccess && tokensSuccess,
  });
}

export function useWithdrawalsFloorDEXData(): UseQueryResult<WithdrawalsFloorDataType> {
  const { data: allTokens, isSuccess: tokensSuccess } = useAllTokensByAddress();

  return useQuery({
    queryKey: [`withdrawalsFloorDEXData-${tokensSuccess ? 'tokens' : ''}`],
    queryFn: async () => {
      const tokens = SUPPORTED_TOKENS_LIST.map(token => token.address);

      if (allTokens) {
        const cdsArray: CallData[][] = [
          ...tokens.map(address => {
            return [
              {
                target: bnJs.Dex.address,
                method: 'getCurrentFloor',
                params: [address],
              },
              {
                target: bnJs.Dex.address,
                method: 'getFloorPercentage',
                params: [address],
              },
              {
                target: bnJs.Dex.address,
                method: 'getTimeDelayMicroSeconds',
                params: [address],
              },
              {
                target: address,
                method: 'balanceOf',
                params: [bnJs.Dex.address],
              },
            ];
          }),
        ];

        const data = await Promise.all(
          cdsArray.map(async (cds, index) => {
            return await bnJs.Multicall.getAggregateData(cds);
          }),
        );

        const assetFloorData = data
          .map((assetDataSet, index) => {
            const token = allTokens[tokens[index]];
            return {
              floor: new BigNumber(assetDataSet[0]).div(10 ** token?.decimals),
              percentageFloor: new BigNumber(assetDataSet[1]).div(10000),
              floorTimeDecayInHours: new BigNumber(assetDataSet[2]).div(1000 * 1000 * 60 * 60),
              current: new BigNumber(assetDataSet[3]).div(10 ** token?.decimals),
              token,
            };
          })
          .filter(item => item.floor.isGreaterThan(0))
          .sort((a, b) =>
            a.current
              .minus(a.floor)
              .times(allTokens[a.token.address].price)
              .isGreaterThan(b.current.minus(b.floor).times(allTokens[b.token.address].price))
              ? -1
              : 1,
          );

        return {
          assetFloorData,
        };
      }
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
    enabled: tokensSuccess,
  });
}

export function useWithdrawalsFloorStabilityFundData(): UseQueryResult<StabilityFundWithdrawalsFloorDataType> {
  const { data: supportedTokens, isSuccess: supportedTokensSuccess } = useWhitelistedTokensList();

  return useQuery({
    queryKey: [`withdrawalsFloorData-${supportedTokens && Object.keys(supportedTokens).length}`],
    queryFn: async () => {
      if (supportedTokens) {
        const { data: allTokens } = await axios.get(`${API_ENDPOINT}tokens`);

        const percentageFloorCallData = {
          target: bnJs.StabilityFund.address,
          method: 'getFloorPercentage',
          params: [],
        };

        const floorTimeDelayCallData = {
          target: bnJs.StabilityFund.address,
          method: 'getTimeDelayMicroSeconds',
          params: [],
        };

        const cds: CallData[] = [
          percentageFloorCallData,
          floorTimeDelayCallData,
          ...supportedTokens.map(address => ({
            target: bnJs.StabilityFund.address,
            method: 'getCurrentFloor',
            params: [address],
          })),
        ];

        const data = await bnJs.Multicall.getAggregateData(cds);

        const percentageFloor = new BigNumber(data[0]).div(10000);
        const floorTimeDecayInHours = new BigNumber(data[1]).div(1000 * 1000 * 60 * 60);

        const currentFundAssetsCds: CallData[] = supportedTokens.map(address => ({
          target: address,
          method: 'balanceOf',
          params: [bnJs.StabilityFund.address],
        }));

        const currentData = await bnJs.Multicall.getAggregateData(currentFundAssetsCds);

        const assetFloorData = data
          .slice(2)
          .map((item, index) => {
            const token = allTokens.find(token => token.address === supportedTokens[index]);
            return {
              floor: token ? new BigNumber(item).div(10 ** token.decimals) : new BigNumber(0),
              current: token ? new BigNumber(currentData[index]).div(10 ** token.decimals) : new BigNumber(0),
              token,
            };
          })
          .filter(item => item.floor.isGreaterThan(0))
          .sort((a, b) => (a.floor.isGreaterThan(b.floor) ? -1 : 1));

        return {
          percentageFloor,
          floorTimeDecayInHours,
          assetFloorData,
        };
      }
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
    enabled: supportedTokensSuccess,
  });
}
