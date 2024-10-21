import { useMemo } from 'react';

import { useTokenPrices } from '@/queries/backendv2';
import { useHoldings, usePOLData } from '@/queries/blockDetails';
import { addresses } from '@balancednetwork/balanced-js';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import { EXTENDED_CHART_COLORS } from '@/queries/nol';
import { CHART_COLORS } from '@/sections/BALNSection/queries';

const daoFundAddress = addresses[1].daofund;
const reserveFundAddress = addresses[1].reserve;

const CHART_TOKENS_COLORS = {
  sICX: '#2ca9b7',
  BALN: '#1694b8',
  bnUSD: '#217f94',
  ETH: '#217f94',
  BTC: '#1694b8',
  default: '#334764',
};

export function useDAOFundTotal(timestamp: number) {
  const { data: POLData, isSuccess: isPOLDataSuccess } = usePOLData(timestamp);
  const { data: holdingsData, isSuccess: isHoldingsDataSuccess } = useHoldings(timestamp, daoFundAddress);
  const { data: tokenPrices, isSuccess: isTokenPricesSuccess } = useTokenPrices();

  return useMemo(() => {
    const holdings =
      holdingsData && tokenPrices
        ? Object.keys(holdingsData).reduce((total, contract) => {
            const token = holdingsData[contract].currency.wrapped;
            const curAmount = new BigNumber(holdingsData[contract].toFixed());
            if (tokenPrices[token.symbol!]) {
              return total + curAmount.times(tokenPrices[token.symbol!]).toNumber();
            } else {
              return total;
            }
          }, 0)
        : 0;

    const POLHoldings = POLData ? POLData.reduce((total, pool) => total + pool.liquidity.toNumber(), 0) : 0;

    if (isPOLDataSuccess && isHoldingsDataSuccess && isTokenPricesSuccess) {
      return {
        holdings,
        POLHoldings,
        total: holdings + POLHoldings,
      };
    }
  }, [POLData, holdingsData, isHoldingsDataSuccess, isPOLDataSuccess, isTokenPricesSuccess, tokenPrices]);
}

export function useReserveFundTotal(timestamp: number) {
  const { data: holdingsData, isSuccess: isHoldingsDataSuccess } = useHoldings(timestamp, reserveFundAddress);
  const { data: tokenPrices, isSuccess: isTokenPricesSuccess } = useTokenPrices();

  return useMemo(() => {
    const holdings =
      holdingsData && tokenPrices
        ? Object.keys(holdingsData).reduce((total, contract) => {
            const token = holdingsData[contract].currency.wrapped;
            const curAmount = new BigNumber(holdingsData[contract].toFixed());
            if (tokenPrices[token.symbol!]) {
              return total + curAmount.times(tokenPrices[token.symbol!]).toNumber();
            } else {
              return total;
            }
          }, 0)
        : 0;

    if (isHoldingsDataSuccess && isTokenPricesSuccess) {
      return {
        total: holdings,
      };
    }
  }, [holdingsData, isHoldingsDataSuccess, isTokenPricesSuccess, tokenPrices]);
}

export function useDAOFundHoldingsPieData() {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  const { data: tokenPrices, isSuccess: isTokenPricesSuccess } = useTokenPrices();
  const { data: holdingsData, isSuccess: isHoldingsDataSuccess } = useHoldings(now, daoFundAddress);

  return useQuery({
    queryKey: [
      `daoFundHoldingsPIE${now}-tokens${tokenPrices ? Object.keys(tokenPrices).length : 0}-${
        holdingsData ? Object.keys(holdingsData).length : 0
      }`,
    ],
    queryFn: () => {
      const data =
        holdingsData && tokenPrices
          ? Object.keys(holdingsData)
              .filter(contract => {
                const token = holdingsData[contract].currency.wrapped;
                const curAmount = new BigNumber(holdingsData[contract].toFixed());
                if (tokenPrices[token.symbol!]) {
                  return curAmount.times(tokenPrices[token.symbol!]).toNumber() > 1000;
                } else {
                  return false;
                }
              })
              .map(contract => {
                const token = holdingsData[contract].currency.wrapped;
                const curAmount = new BigNumber(holdingsData[contract].toFixed());
                if (tokenPrices && tokenPrices[token.symbol!]) {
                  return {
                    name: token.symbol,
                    value: curAmount.times(tokenPrices[token.symbol!]).toNumber(),
                    fill: EXTENDED_CHART_COLORS[token.symbol!] || EXTENDED_CHART_COLORS.default,
                    amount: curAmount.toNumber(),
                  };
                } else {
                  return {};
                }
              })
          : [];

      const template = ['bnUSD', 'sICX', 'BALN'];
      return data.sort((a, b) => {
        const aIndex = template.indexOf(a.name!);
        const bIndex = template.indexOf(b.name!);

        if (aIndex === -1 && bIndex === -1) {
          return b.value! - a.value!;
        } else if (aIndex === -1) {
          return 1;
        } else if (bIndex === -1) {
          return -1;
        } else {
          return aIndex - bIndex;
        }
      });
    },
    placeholderData: keepPreviousData,
    enabled: isTokenPricesSuccess && isHoldingsDataSuccess,
  });
}

export function useReserveFundHoldingsPieData() {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  const { data: tokenPrices, isSuccess: isTokenPricesSuccess } = useTokenPrices();
  const { data: holdingsData, isSuccess: isHoldingsDataSuccess } = useHoldings(now, reserveFundAddress);

  return useQuery({
    queryKey: [
      `reserveFundHoldingsPIE${now}-tokens${tokenPrices ? Object.keys(tokenPrices).length : 0}-${
        holdingsData ? Object.keys(holdingsData).length : 0
      }`,
    ],
    queryFn: () => {
      const data =
        holdingsData && tokenPrices
          ? Object.keys(holdingsData)
              .filter(contract => {
                const token = holdingsData[contract].currency.wrapped;
                const curAmount = new BigNumber(holdingsData[contract].toFixed());
                if (tokenPrices[token.symbol!]) {
                  return curAmount.times(tokenPrices[token.symbol!]).toNumber() > 500;
                } else {
                  return false;
                }
              })
              .map(contract => {
                const token = holdingsData[contract].currency.wrapped;
                const curAmount = new BigNumber(holdingsData[contract].toFixed());
                if (tokenPrices && tokenPrices[token.symbol!]) {
                  return {
                    name: token.symbol,
                    value: curAmount.times(tokenPrices[token.symbol!]).toNumber(),
                    fill: EXTENDED_CHART_COLORS[token.symbol!] || EXTENDED_CHART_COLORS.default,
                    amount: curAmount.toNumber(),
                  };
                } else {
                  return {};
                }
              })
          : [];

      const template = ['bnUSD', 'sICX', 'BALN'];
      return data.sort((a, b) => {
        const aIndex = template.indexOf(a.name!);
        const bIndex = template.indexOf(b.name!);

        if (aIndex === -1 && bIndex === -1) {
          return b.value! - a.value!;
        } else if (aIndex === -1) {
          return 1;
        } else if (bIndex === -1) {
          return -1;
        } else {
          return aIndex - bIndex;
        }
      });
    },
    placeholderData: keepPreviousData,
    enabled: isTokenPricesSuccess && isHoldingsDataSuccess,
  });
}

export function useDAOFundPOLPieData() {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  const { data: POLData, isSuccess: isPOLDataSuccess } = usePOLData(now);

  return useQuery({
    queryKey: [
      `daoFundHoldings${now}-tokens${POLData ? POLData.length : 0}-${POLData ? Object.keys(POLData).length : 0}`,
    ],
    queryFn: () => {
      const data = POLData
        ? POLData.map((pool, index) => {
            return {
              name: pool?.pair?.name,
              value: pool.liquidity.toNumber(),
              fill: CHART_COLORS[index] || CHART_COLORS[CHART_COLORS.length - 1],
            };
          }).filter(pool => pool.value > 1000)
        : [];

      const template = ['sICX/bnUSD', 'ETH/bnUSD', 'BTCB/bnUSD', 'BALN'];
      return data.sort((a, b) => {
        const aIndex = template.indexOf(a.name!);
        const bIndex = template.indexOf(b.name!);

        if (aIndex === -1 && bIndex === -1) {
          return b.value! - a.value!;
        } else if (aIndex === -1) {
          return 1;
        } else if (bIndex === -1) {
          return -1;
        } else {
          return aIndex - bIndex;
        }
      });
    },
    placeholderData: keepPreviousData,
    enabled: isPOLDataSuccess,
  });
}

export function useHoldingsBreakdownPieData() {
  const oneMinPeriod = 1000 * 60;
  const now = Math.floor(new Date().getTime() / oneMinPeriod) * oneMinPeriod;

  const { data: tokenPrices, isSuccess: isTokenPricesSuccess } = useTokenPrices();
  const { data: POLData, isSuccess: isPOLDataSuccess } = usePOLData(now);
  const { data: holdings, isSuccess: isHoldingsSuccess } = useHoldings(now, daoFundAddress);
  const { data: reserve, isSuccess: isReserveSuccess } = useHoldings(now, reserveFundAddress);

  return useQuery({
    queryKey: [
      `holdingsBreakdown${now}-tokens${tokenPrices ? tokenPrices.length : 0}-${
        POLData ? Object.keys(POLData).length : 0
      }`,
    ],
    queryFn: () => {
      if (!tokenPrices) return;

      const totalPOL = POLData ? POLData.reduce((total, pool) => total + pool.liquidity.toNumber(), 0) : 0;

      const totalHoldings = holdings
        ? Object.keys(holdings).reduce((total, contract) => {
            const token = holdings[contract].currency.wrapped;
            const curAmount = new BigNumber(holdings[contract].toFixed());
            if (tokenPrices[token.symbol!]) {
              return total + curAmount.times(tokenPrices[token.symbol!]).toNumber();
            } else {
              return total;
            }
          }, 0)
        : 0;

      const totalReserve = reserve
        ? Object.keys(reserve).reduce((total, contract) => {
            const token = reserve[contract].currency.wrapped;
            const curAmount = new BigNumber(reserve[contract].toFixed());
            if (tokenPrices[token.symbol!]) {
              return total + curAmount.times(tokenPrices[token.symbol!]).toNumber();
            } else {
              return total;
            }
          }, 0)
        : 0;

      const data = [
        {
          name: 'Liquidity',
          value: totalPOL,
          fill: CHART_COLORS[0] || CHART_COLORS[CHART_COLORS.length - 1],
        },
        {
          name: 'DAO Fund',
          value: totalHoldings,
          fill: CHART_COLORS[1] || CHART_COLORS[CHART_COLORS.length - 1],
        },
        {
          name: 'Reserve Fund',
          value: totalReserve,
          fill: CHART_COLORS[2] || CHART_COLORS[CHART_COLORS.length - 1],
        },
      ];

      return data;
    },
    placeholderData: keepPreviousData,
    enabled: isPOLDataSuccess && isHoldingsSuccess && isReserveSuccess && isTokenPricesSuccess,
  });
}
