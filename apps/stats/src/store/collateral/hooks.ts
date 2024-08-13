import { useMemo } from 'react';

import { addresses, CallData } from '@balancednetwork/balanced-js';
import BigNumber from 'bignumber.js';
import { useFundLimits, useWhitelistedTokensList } from '@/queries';
import { useTokenPrices } from '@/queries/backendv2';
import { useStabilityFundHoldings } from '@/queries/blockDetails';
import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query';

import bnJs from '@/bnJs';
import { NETWORK_ID } from '@/constants/config';
import { ONE } from '@/constants/number';
import { formatUnits } from '@/utils';

type CollateralData = {
  symbol: string;
  amount: BigNumber;
  tvl: BigNumber;
};

export function useTokensCollateralData(): UseQueryResult<CollateralData[]> {
  const { data: tvls } = useTokensCollateralTVLs();
  const { data: supportedTokens } = useSupportedCollateralTokens();
  const { data: tokenPrices, isSuccess: tokenPricesQuerySuccess } = useTokenPrices();

  return useQuery({
    queryKey: [`collateralData${tvls ? tvls.length : ''}`],
    queryFn: async () => {
      const data = await (tvls &&
        supportedTokens &&
        Promise.all(
          Object.keys(tvls).map(async cx => {
            const decimals = await bnJs.getContract(cx).decimals();
            const collateralAmount = new BigNumber(formatUnits(tvls[cx], parseInt(decimals, 16), 18));
            const symbol = Object.keys(supportedTokens)[Object.values(supportedTokens).indexOf(cx)];
            return {
              symbol,
              amount: collateralAmount,
              tvl: collateralAmount.times((tokenPrices && tokenPrices[symbol]) || ONE),
            };
          }),
        ));

      return data;
    },
    placeholderData: keepPreviousData,
    enabled: tokenPricesQuerySuccess,
  });
}

export function useTokensCollateralTVLs() {
  const { data: supportedTokens } = useSupportedCollateralTokens();
  const tokens = supportedTokens ? Object.values(supportedTokens) : [];
  const cds: CallData[] = tokens.map(token => ({
    target: token,
    method: 'balanceOf',
    params: [addresses[NETWORK_ID].loans],
  }));

  return useQuery({
    queryKey: [`collateralAmounts${tokens.length}`],
    queryFn: async () => {
      const amounts = await bnJs.Multicall.getAggregateData(cds);

      return tokens.length
        ? amounts.reduce((data, tvl, index) => {
            data[tokens[index]] = tvl;
            return data;
          }, {})
        : undefined;
    },
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
      const debtCeilings = debtCeilingsData.map(ceiling => parseInt(formatUnits(ceiling)));

      const supportedTokens = {};
      Object.keys(data).forEach((symbol, index) => {
        if (debtCeilings[index] > 0 || symbol === 'BTCB') {
          supportedTokens[symbol] = data[symbol];
        }
      });

      return supportedTokens;
    },
  });
}

export function useStabilityFundTotal() {
  const fiveMinPeriod = 1000 * 60 * 5;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: holdings } = useStabilityFundHoldings(now);
  const { data: fundLimits } = useFundLimits();
  const { data: addresses } = useWhitelistedTokensList();

  return useMemo(
    () => ({
      tokenCount: addresses && addresses.length,
      maxLimit:
        fundLimits &&
        Object.values(fundLimits).reduce(
          (total, limit) => total.plus(new BigNumber(limit.toFixed())),
          new BigNumber(0),
        ),
      total:
        holdings &&
        Object.values(holdings).reduce(
          (total, holding) => total.plus(new BigNumber(holding.toFixed())),
          new BigNumber(0),
        ),
    }),
    [holdings, fundLimits, addresses],
  );
}

export function useTotalCollateral() {
  const fundInfo = useStabilityFundTotal();
  const { data: tokensInfo } = useTokensCollateralData();

  return useMemo(() => {
    if (fundInfo && fundInfo.total && tokensInfo) {
      const tokensTotal = tokensInfo.reduce((total, token) => total.plus(token.tvl), new BigNumber(0));
      return tokensTotal.plus(fundInfo.total);
    }
  }, [fundInfo, tokensInfo]);
}

// export function useCollateralLocked(cx: string) {
//   const oneMinPeriod = 1000 * 60;
//   const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

//   const getBalance = async () => await bnJs.getContract(cx).balanceOf(addresses[NETWORK_ID].loans);

//   return useQuery(`collateralFor${cx}at${now}`, getBalance);
// }
