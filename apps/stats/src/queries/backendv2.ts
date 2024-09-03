import { useBnJsContractQuery, useIncentivisedPairs } from '@/queries';
import { Fraction } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import bnJs from '@/bnJs';
import { predefinedCollateralTypes } from '@/components/CollateralSelector/CollateralTypeList';
import { TOKEN_BLACKLIST } from '@/constants/tokens';
import { formatUnits } from '@/utils';
import { useMemo } from 'react';

export const API_ENDPOINT = 'https://balanced.icon.community/api/v1/';

export type ContractMethodsDataType = {
  address: string;
  timestamp: number;
  updateInterval: number;
  method: string;
  days_since_launch: number;
  date: string;
  contract_name: string;
  value: number;
};

export const useContractMethodsDataQuery = (
  contract: string,
  method: string,
  skip: number = 0,
  limit: number = 1000,
  days_ago?: number,
  start_timestamp?: number,
  end_timestamp?: number,
) => {
  const queryKey = ['historicalQuery', skip, limit, contract, method, days_ago, start_timestamp, end_timestamp];

  return useQuery<ContractMethodsDataType[]>({
    queryKey: queryKey,
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=${skip}&limit=${limit}&address=${contract}&method=${method}${
          days_ago ? `&days_ago=${days_ago}` : ''
        }${start_timestamp ? `&start_timestamp=${start_timestamp}` : ''}${
          end_timestamp ? `&end_timestamp=${end_timestamp}` : ''
        }`,
      );

      return data.map(item => {
        item.timestamp *= 1_000;
        return item;
      });
    },
  });
};

export type TokenStats = {
  address: string;
  decimals: number;
  holders: number;
  liquidity: number;
  logo_uri: string;
  name: string;
  path: string[];
  pools: number[];
  price: number;
  price_7d: number;
  price_24h: number;
  price_30d: number;
  price_24h_change: number;
  symbol: string;
  total_supply: number;
  type: 'community' | 'balanced';
};

export function useAllTokens() {
  const MIN_LIQUIDITY_TO_INCLUDE = 500;

  return useQuery({
    queryKey: [`allTokens`],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINT}tokens`);

      if (response.status === 200) {
        return response.data
          .map(item => {
            item['market_cap'] = item.total_supply * item.price;
            item['price_24h_change'] = ((item.price - item.price_24h) / item.price_24h) * 100;
            return item;
          })
          .filter(
            item =>
              !TOKEN_BLACKLIST.some(token => token.address === item['address']) &&
              (item['liquidity'] > MIN_LIQUIDITY_TO_INCLUDE || item['address'] === 'ICX'),
          ) as TokenStats[];
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllTokensByAddress(): UseQueryResult<{ [key in string]: TokenStats }> {
  const { data: allTokens, isSuccess: allTokensSuccess } = useAllTokens();

  return useQuery({
    queryKey: [`allTokensByAddress`],
    queryFn: () => {
      if (!allTokens) return;
      return allTokens.reduce((tokens, item) => {
        tokens[item['address']] = item;
        return tokens;
      }, {});
    },
    placeholderData: keepPreviousData,
    enabled: allTokensSuccess,
  });
}

export type Pair = {
  id: string;
  name: string;
  baseAddress: string;
  quoteAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
  liquidity: number;
  fees24h: number;
  fees30d: number;
  volume24h: number;
  volume30d: number;
  feesApy: number;
  balnApy?: number;
  totalSupply: number;
};

export function useAllPairs() {
  const MIN_LIQUIDITY_TO_INCLUDE = 1000;

  return useQuery<Pair[]>({
    queryKey: [`allPairs`],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINT}pools`);

      if (response.status === 200) {
        try {
          const pairs = response.data.map(item => {
            const liquidity = item['base_supply'] * item['base_price'] + item['quote_supply'] * item['quote_price'];
            const fees24hProviders =
              item['base_lp_fees_24h'] * item['base_price'] + item['quote_lp_fees_24h'] * item['quote_price'];
            const fees24hBaln =
              item['base_baln_fees_24h'] * item['base_price'] + item['quote_baln_fees_24h'] * item['quote_price'];
            const fees30dProviders =
              item['base_lp_fees_30d'] * item['base_price'] + item['quote_lp_fees_30d'] * item['quote_price'];
            const fees30dBaln =
              item['base_baln_fees_30d'] * item['base_price'] + item['quote_baln_fees_30d'] * item['quote_price'];
            const volume24h =
              item['base_volume_24h'] * item['base_price'] + item['quote_volume_24h'] * item['quote_price'];
            const volume30d =
              item['base_volume_30d'] * item['base_price'] + item['quote_volume_30d'] * item['quote_price'];

            const fees24h = fees24hProviders + fees24hBaln;
            const fees30d = fees30dProviders + fees30dBaln;
            const feesApy = liquidity > 0 ? (fees30dProviders * 12) / liquidity : 0;

            const pair: Pair = {
              id: item['pool_id'],
              name: item['name'],
              baseAddress: item['base_address'],
              quoteAddress: item['quote_address'],
              baseSymbol: item['base_symbol'],
              quoteSymbol: item['quote_symbol'],
              liquidity,
              fees24h: fees24h || 0,
              fees30d: fees30d || 0,
              volume24h,
              volume30d,
              feesApy: feesApy || 0,
              totalSupply: item['total_supply'],
            };

            return pair;
          });

          return pairs.filter(item => item.liquidity >= MIN_LIQUIDITY_TO_INCLUDE || item.name === 'sICX/ICX');
        } catch (e) {
          console.error('Error while working with fetched pools data: ', e);
        }
      }
    },
    placeholderData: keepPreviousData,
    refetchInterval: 4000,
  });
}

export function useAllPairsIncentivised() {
  const { data: allPairs } = useAllPairs();
  const { data: allTokens } = useAllTokensByAddress();
  const { data: incentivisedPairs } = useIncentivisedPairs();
  const { data: dailyDistributionRaw } = useBnJsContractQuery<string>(bnJs, 'Rewards', 'getEmission', []);
  const balnPrice: number = allTokens ? allTokens[bnJs.BALN.address].price : 0;
  const dailyDistribution = dailyDistributionRaw && new BigNumber(formatUnits(dailyDistributionRaw, 18, 4));

  return useMemo(() => {
    if (allPairs) {
      return allPairs.map(item => {
        const incentivisedPair =
          incentivisedPairs && incentivisedPairs.find(incentivisedPair => incentivisedPair.id === parseInt(item.id));

        if (incentivisedPair && dailyDistribution) {
          const stakedRatio =
            incentivisedPair.id !== 1
              ? new Fraction(incentivisedPair.totalStaked, item['totalSupply'])
              : new Fraction(1);
          item['balnApy'] = dailyDistribution
            .times(new BigNumber(incentivisedPair.rewards.toFixed(4)))
            .times(365)
            .times(balnPrice)
            .div(new BigNumber(stakedRatio.toFixed(18)).times(item.liquidity))
            .toNumber();
          item['stakedRatio'] = stakedRatio;

          return item;
        }
        return item;
      });
    }
  }, [allPairs, incentivisedPairs, dailyDistribution, balnPrice]);
}

export function useAllPairsIncentivisedById() {
  const allPairs = useAllPairsIncentivised();

  return useQuery<{ [key in string]: Pair } | undefined>({
    queryKey: [`allPairsIncentivisedById`, allPairs ? allPairs.length : 0],
    queryFn: () => {
      if (allPairs) {
        return allPairs.reduce((allPairs, item) => {
          allPairs[item['id']] = item;
          return allPairs;
        }, {});
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllPairsIncentivisedByName() {
  const allPairs = useAllPairsIncentivised();

  return useQuery<{ [key in string]: Pair } | undefined>({
    queryKey: [`allPairsIncentivisedByName`, allPairs ? allPairs.length : 0],
    queryFn: () => {
      if (allPairs) {
        return allPairs.reduce((allPairs, item) => {
          allPairs[item['name']] = item;
          return allPairs;
        }, {});
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllPairsById() {
  const { data: allPairs, isSuccess: allPairsSuccess } = useAllPairs();

  return useQuery<{ [key in string]: Pair } | undefined>({
    queryKey: ['allPairsById'],
    queryFn: () => {
      if (allPairs) {
        return allPairs.reduce((allPairs, item) => {
          allPairs[item['id']] = item;
          return allPairs;
        }, {});
      }
    },
    placeholderData: keepPreviousData,
    enabled: allPairsSuccess,
  });
}
export function useAllPairsByName() {
  const { data: allPairs, isSuccess: allPairsSuccess } = useAllPairs();

  return useQuery<{ [key in string]: Pair } | undefined>({
    queryKey: ['allPairsByName'],
    queryFn: () => {
      if (allPairs) {
        return allPairs.reduce((allPairs, item) => {
          allPairs[item['name']] = item;
          return allPairs;
        }, {});
      }
    },
    placeholderData: keepPreviousData,
    enabled: allPairsSuccess,
  });
}

export const useAllPairsTotal = () => {
  const { data: allPairs, isSuccess: allPairsSuccess } = useAllPairs();

  return useQuery<{ tvl: number; volume: number; fees: number } | undefined>({
    queryKey: ['pairsTotal'],
    queryFn: () => {
      if (allPairs) {
        return Object.values(allPairs).reduce(
          (total, pair) => {
            total.tvl += pair.liquidity;
            total.volume += pair.volume24h ? pair.volume24h : 0;
            total.fees += pair.fees24h ? pair.fees24h : 0;
            return total;
          },
          { tvl: 0, volume: 0, fees: 0 },
        );
      }
    },
    placeholderData: keepPreviousData,
    enabled: allPairsSuccess,
  });
};

export function useTokenPrices() {
  const { data: allTokens, isSuccess: allTokensSuccess } = useAllTokens();

  return useQuery<{ [key in string]: BigNumber }>({
    queryKey: ['tokenPrices', allTokens],
    queryFn: () => {
      if (allTokens) {
        return allTokens.reduce((tokens, item) => {
          tokens[item['symbol']] = new BigNumber(item.price);
          return tokens;
        }, {});
      } else {
        return [];
      }
    },
    placeholderData: keepPreviousData,
    enabled: allTokensSuccess,
  });
}

function trimStartingZeroValues(array: any[]): any[] {
  if (array) {
    return array.filter((item, index) => item && array[Math.min(index + 1, array.length - 1)].value !== 0);
  } else {
    return [];
  }
}

function setTimeToMs(array: any[]): any[] {
  return array.map(item => {
    item.timestamp *= 1_000;
    return item;
  });
}

type CollateralData = {
  series: { [key in string]: { timestamp: number; value: number; IUSDC?: number; USDS?: number; BUSD?: number }[] };
  current: { [key in string]: { amount: number; value: number } };
};

export function useAllCollateralData() {
  const { data: tokenPrices, isSuccess: isTokenQuerySuccess } = useTokenPrices();

  return useQuery({
    queryKey: [`allCollateralDataBE`],
    queryFn: async () => {
      if (tokenPrices) {
        const result: CollateralData = {
          series: {},
          current: {},
        };
        const responseSICX = await axios.get(
          `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_sICX_balance`,
        );
        const responseINJ = await axios.get(
          `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_INJ_balance`,
        );
        const responseBNB = await axios.get(
          `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_BNB_balance`,
        );
        const responseAVAX = await axios.get(
          `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_AVAX_balance`,
        );
        const responseBTC = await axios.get(
          `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_BTC_balance`,
        );
        const responseETH = await axios.get(
          `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_ETH_balance`,
        );
        const responseStabilityFund = await axios.get(`${API_ENDPOINT}historical/stability?skip=0&limit=1000`);

        try {
          const seriesSICX = setTimeToMs(trimStartingZeroValues(responseSICX.data));
          const seriesETH = setTimeToMs(trimStartingZeroValues(responseETH.data));
          const seriesStability = setTimeToMs(trimStartingZeroValues(responseStabilityFund.data));
          const seriesINJ = setTimeToMs(trimStartingZeroValues(responseINJ.data));
          const seriesBNB = setTimeToMs(trimStartingZeroValues(responseBNB.data));
          const seriesAVAX = setTimeToMs(trimStartingZeroValues(responseAVAX.data));
          const seriesBTC = setTimeToMs(trimStartingZeroValues(responseBTC.data));

          const seriesSICXCopy = seriesSICX.slice();
          const seriesETHCopy = seriesETH.slice();
          const seriesStabilityCopy = seriesStability.slice();
          const seriesINJCopy = seriesINJ.slice();
          const seriesBNBCopy = seriesBNB.slice();
          const seriesAVAXCopy = seriesAVAX.slice();
          const seriesBTCCopy = seriesBTC.slice();

          const seriesTotal = seriesSICXCopy.map((item, index) => {
            let currentTotal = tokenPrices['sICX'].times(item.value);

            if (seriesETHCopy[index]) {
              currentTotal = currentTotal.plus(tokenPrices['ETH'].times(seriesETHCopy[index].value));
            }

            if (seriesStabilityCopy[index]) {
              currentTotal = currentTotal.plus(seriesStabilityCopy[index]['sum_of_values']);
            }

            if (seriesINJCopy[index]) {
              currentTotal = currentTotal.plus(tokenPrices['INJ'].times(seriesINJCopy[index].value));
            }

            if (seriesBNBCopy[index]) {
              currentTotal = currentTotal.plus(tokenPrices['BNB'].times(seriesBNBCopy[index].value));
            }

            if (seriesAVAXCopy[index]) {
              currentTotal = currentTotal.plus(tokenPrices['AVAX'].times(seriesAVAXCopy[index].value));
            }

            if (seriesBTCCopy[index]) {
              currentTotal = currentTotal.plus(tokenPrices['BTC'].times(seriesBTCCopy[index].value));
            }

            return {
              timestamp: item.timestamp,
              value: Math.floor(currentTotal.toNumber()),
            };
          });

          result.series['sICX'] = seriesSICX.slice().reverse();
          result.series['ETH'] = seriesETH.slice().reverse();
          result.series['fundTotal'] = seriesStabilityCopy
            .map(item => ({ ...item, value: item.sum_of_values }))
            .slice()
            .reverse();
          result.series['INJ'] = seriesINJ.slice().reverse();
          result.series['BNB'] = seriesBNB.slice().reverse();
          result.series['AVAX'] = seriesAVAX.slice().reverse();
          result.series['BTC'] = seriesBTC.slice().reverse();
          result.series['total'] = seriesTotal.slice().reverse();

          result.current['sICX'] = {
            amount: seriesSICX[0].value,
            value: tokenPrices['sICX'].times(seriesSICX[0].value).toNumber(),
          };
          result.current['ETH'] = {
            amount: seriesETH[0].value,
            value: tokenPrices['ETH'].times(seriesETH[0].value).toNumber(),
          };
          result.current['fundTotal'] = {
            amount: result.series['fundTotal'][result.series['fundTotal'].length - 1].value,
            value: result.series['fundTotal'][result.series['fundTotal'].length - 1].value,
          };
          result.current['INJ'] = {
            amount: seriesINJ[0].value,
            value: tokenPrices['INJ'].times(seriesINJ[0].value).toNumber(),
          };
          result.current['BNB'] = {
            amount: seriesBNB[0].value,
            value: tokenPrices['BNB'].times(seriesBNB[0].value).toNumber(),
          };
          result.current['AVAX'] = {
            amount: seriesAVAX[0].value,
            value: tokenPrices['AVAX'].times(seriesAVAX[0].value).toNumber(),
          };
          result.current['BTC'] = {
            amount: seriesBTC[0].value,
            value: tokenPrices['BTC'].times(seriesBTC[0].value).toNumber(),
          };
          result.current['total'] = {
            amount: result.series['total'][result.series['total'].length - 1].value,
            value: result.series['total'][result.series['total'].length - 1].value,
          };

          return result;
        } catch (e) {
          console.error(e);
        }
      }
    },

    enabled: isTokenQuerySuccess,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

export function useCollateralDataFor(daysBack: number) {
  const { data: collateralData, isSuccess: collateralDataQuerySuccess } = useAllCollateralData();

  function trimDays(array) {
    if (array.length <= daysBack) {
      return array;
    } else {
      return array.slice().slice(1 - (daysBack + 1));
    }
  }

  return useQuery({
    queryKey: [`collateralDataFor`, daysBack, `days`],
    queryFn: () => {
      if (daysBack === -1) {
        return collateralData;
      } else {
        if (collateralData) {
          const copy = JSON.parse(JSON.stringify(collateralData));
          const trimmedSeries = Object.keys(copy.series).reduce((trimmed, current) => {
            trimmed[current] = trimDays(copy.series[current]);
            return trimmed;
          }, {});
          copy.series = trimmedSeries;
          return copy;
        }
      }
    },

    enabled: collateralDataQuerySuccess,
    placeholderData: keepPreviousData,
  });
}

export function useAllDebtData() {
  const { data: stabilityFundInfo } = useAllCollateralData();
  return useQuery({
    queryKey: [`allDebtDataBE`, stabilityFundInfo ? Object.keys(stabilityFundInfo).length : '-'],
    queryFn: async () => {
      const responseSICX = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_collateral_debt_sICX_bnusd`,
      );
      const responseETH = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_collateral_debt_ETH_bnusd`,
      );
      const responseINJ = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_collateral_debt_INJ_bnusd`,
      );

      const responseBNB = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_collateral_debt_BNB_bnusd`,
      );
      const responseAVAX = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_collateral_debt_AVAX_bnusd`,
      );
      const responseBTC = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=0&limit=1000&contract_name=loans_collateral_debt_BTC_bnusd`,
      );
      const responseTotal = await axios.get(
        `${API_ENDPOINT}contract-methods?skip=0&limit=1000&address=${bnJs.bnUSD.address}&method=totalSupply`,
      );

      try {
        const seriesSICX = responseSICX.data && setTimeToMs(trimStartingZeroValues(responseSICX.data));
        const seriesETH = responseSICX.data && setTimeToMs(trimStartingZeroValues(responseETH.data));
        const seriesINJ = responseINJ.data && setTimeToMs(trimStartingZeroValues(responseINJ.data));
        const seriesBNB = responseBNB.data && setTimeToMs(trimStartingZeroValues(responseBNB.data));
        const seriesAVAX = responseAVAX.data && setTimeToMs(trimStartingZeroValues(responseAVAX.data));
        const seriesBTC = responseBTC.data && setTimeToMs(trimStartingZeroValues(responseBTC.data));
        const seriesTotal = responseTotal.data && setTimeToMs(trimStartingZeroValues(responseTotal.data));

        const seriesFund = stabilityFundInfo?.series['fundTotal'];

        return {
          sICX: seriesSICX.reverse(),
          ETH: seriesETH.reverse(),
          INJ: seriesINJ.reverse(),
          BNB: seriesBNB.reverse(),
          AVAX: seriesAVAX.reverse(),
          BTC: seriesBTC.reverse(),
          [predefinedCollateralTypes.STABILITY_FUND]: seriesFund,
          [predefinedCollateralTypes.ALL]: seriesTotal.reverse(),
        };
      } catch (e) {
        console.error(e);
      }
    },
  });
}

export function useDebtDataFor(daysBack: number) {
  const { data: debtData, isSuccess: debtDataQuerySuccess } = useAllDebtData();

  function trimDays(array) {
    if (array.length <= daysBack) {
      return array;
    } else {
      return array.slice().slice(1 - (daysBack + 1));
    }
  }

  return useQuery({
    queryKey: [`collateralDebtFor`, daysBack, `days`],
    queryFn: () => {
      if (daysBack === -1) {
        return debtData;
      } else {
        if (debtData) {
          let copy = JSON.parse(JSON.stringify(debtData));
          const trimmedSeries = Object.keys(copy).reduce((trimmed, current) => {
            trimmed[current] = trimDays(copy[current]);
            return trimmed;
          }, {});
          copy = trimmedSeries;
          return copy;
        }
      }
    },
    enabled: debtDataQuerySuccess,
    placeholderData: keepPreviousData,
  });
}

export function useTokenTrendData(tokenSymbol, start, end) {
  return useQuery({
    queryKey: [`trend`, tokenSymbol, start, end],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ENDPOINT}tokens/series/1h/${start}/${end}?symbol=${tokenSymbol}`);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
