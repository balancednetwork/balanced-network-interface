import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import bnJs from '@/bnJs';
import { NETWORK_ID } from '@/constants/config';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import { useTokenPrices } from '@/queries/backendv2';
import { API_ENDPOINT, BlockDetails, useBlockDetails } from '@/queries/blockDetails';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { formatUnits } from '@/utils';
import { addresses, CallData } from '@balancednetwork/balanced-js';

export function useTotalBnUSDLocked(): UseQueryResult<CurrencyAmount<Token> | undefined> {
  return useQuery({
    queryKey: ['bnUSDtotalLocked'],
    queryFn: async () => {
      try {
        const totalLocked = await bnJs.bnUSD.balanceOf(bnJs.Savings.address);
        return CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address], totalLocked);
      } catch (e) {
        console.error('Error while fetching total locked bnUSD, return 0: ', e);
        return CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address], '0');
      }
    },
    refetchInterval: 2000,
    placeholderData: keepPreviousData,
  });
}

function useTricklerAllowedTokens(): UseQueryResult<string[] | undefined> {
  return useQuery({
    queryKey: ['tricklerTokens'],
    queryFn: async () => {
      const tokens = await bnJs.Trickler.getAllowListTokens();
      return tokens;
    },
    placeholderData: keepPreviousData,
  });
}

function useTricklerDistributionPeriod(): UseQueryResult<number | undefined> {
  return useQuery({
    queryKey: ['tricklerDistributionPeriod'],
    queryFn: async () => {
      const periodInBlocks = await bnJs.Trickler.getDistributionPeriod();
      return periodInBlocks;
    },
    placeholderData: keepPreviousData,
  });
}

export function useSupportedCollateralTokens(): UseQueryResult<{ [key in string]: string }> {
  return useQuery({
    queryKey: ['getCollateralTokens'],
    queryFn: async () => {
      const data = await bnJs.Loans.getCollateralTokens();

      const cds: CallData[] = Object.keys(data).map(symbol => ({
        target: addresses[NETWORK_ID].loans,
        method: 'getDebtCeiling',
        params: [symbol],
      }));

      const debtCeilingsData = await bnJs.Multicall.getAggregateData(cds);

      const debtCeilings = debtCeilingsData.map(ceiling => (ceiling === null ? 1 : parseInt(formatUnits(ceiling))));

      const supportedTokens = {};
      Object.keys(data).forEach((symbol, index) => {
        if (debtCeilings[index] > 0) {
          supportedTokens[symbol] = data[symbol];
        }
      });

      return supportedTokens;
    },
  });
}

export function useSavingsRateInfo(): UseQueryResult<
  | {
      totalLocked: CurrencyAmount<Token>;
      dailyPayout: BigNumber;
      APR: BigNumber;
      monthlyRewards: BigNumber;
      upcomingRewards: BigNumber;
    }
  | undefined
> {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: blockThen } = useBlockDetails(new Date(now).setDate(new Date().getDate() - 30));
  const { data: tokenPrices } = useTokenPrices();
  const { data: totalLocked } = useTotalBnUSDLocked();
  const { data: tokenList } = useTricklerAllowedTokens();
  const { data: periodInBlocks } = useTricklerDistributionPeriod();
  const { data: collateralTokens } = useSupportedCollateralTokens();

  return useQuery({
    queryKey: [
      `savingsRate`,
      blockThen?.number || '',
      totalLocked?.toFixed() || '',
      Object.keys(tokenPrices ?? {}).length,
      tokenList?.length ?? '',
      Object.keys(collateralTokens ?? {}).length,
      periodInBlocks ?? '',
    ],
    queryFn: async () => {
      if (
        tokenPrices === undefined ||
        totalLocked === undefined ||
        tokenList === undefined ||
        collateralTokens === undefined ||
        periodInBlocks === undefined ||
        blockThen === undefined
      )
        return;

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
        monthlyRewards,
        APR,
      };
    },
    placeholderData: keepPreviousData,
    enabled: !!tokenPrices && !!tokenList && !!collateralTokens && !!blockThen,
  });
}

export function useDepositsChartData(): UseQueryResult<
  | {
      timestamp: number;
      value: BigNumber;
    }[]
  | undefined
> {
  const createdTS = 1708069398372;
  const { data: blockThen } = useBlockDetails(new Date(createdTS).setDate(new Date().getDate() - 30));
  const fiveMinPeriod = 1000 * 300;
  const nowTs = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;

  const dataPointsCount = 20;

  return useQuery({
    queryKey: [`depositsChartData`],
    queryFn: async () => {
      if (blockThen === undefined) return;

      function generateTimestamps(start: number, end: number, n: number): number[] {
        const interval = (end - start) / (n - 1);
        const timestamps = Array.from({ length: n }, (_, i) => Math.floor(start + interval * i));
        return timestamps;
      }

      const timestamps = generateTimestamps(createdTS, nowTs, dataPointsCount);
      const blocks: BlockDetails[] = await Promise.all(
        timestamps.map(async timestamp => {
          const response = await axios.get(`${API_ENDPOINT}blocks/timestamp/${timestamp * 1000}`);
          return response.data;
        }),
      );

      const deposits: { timestamp: number; value: number }[] = await Promise.all(
        blocks.map(async block => {
          const response = await bnJs.bnUSD.balanceOf(bnJs.Savings.address, block.number);
          return {
            value: parseInt(
              CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address], response).toFixed(0),
            ),
            timestamp: Math.floor(block.timestamp / 1000),
          };
        }),
      );

      return deposits;
    },
    placeholderData: keepPreviousData,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    enabled: !!blockThen,
  });
}
