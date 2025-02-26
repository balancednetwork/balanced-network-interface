import { useMemo } from 'react';

import { CallData, addresses } from '@balancednetwork/balanced-js';
import { bnJs } from '@balancednetwork/xwagmi';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import { NETWORK_ID } from '@/constants/config';
import { ORACLE_PRICED_TOKENS, PYTH_PRICED_TOKENS } from '@/constants/tokens';
import { useCollateralType, useSupportedCollateralTokens } from '@/store/collateral/hooks';
import { formatUnits } from '@/utils';
import { fixWrongSymbol } from '@/utils/formatter';
import axios from 'axios';

export function useOraclePrice(symbol?: string): BigNumber | undefined {
  const oraclePrices = useOraclePrices();
  const collateralType = useCollateralType();

  return useMemo(() => {
    if (oraclePrices) return oraclePrices[symbol || collateralType];
  }, [oraclePrices, collateralType, symbol]);
}

// fetch price data every 5 secs
const PERIOD = 5 * 1000;

export function useOraclePrices() {
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();

  const supportedSymbols = useMemo(
    () => supportedCollateralTokens && Object.keys(supportedCollateralTokens),
    [supportedCollateralTokens],
  );

  const oracleSymbols = useMemo(
    () => (supportedSymbols ? [...ORACLE_PRICED_TOKENS, ...supportedSymbols] : undefined),
    [supportedSymbols],
  );

  const query = useQuery({
    queryKey: ['oraclePrices', oracleSymbols],
    queryFn: async () => {
      if (!oracleSymbols) {
        return;
      }
      const cds: CallData[] = oracleSymbols.map(symbol => {
        return {
          target: addresses[NETWORK_ID].balancedOracle,
          method: 'getLastPriceInLoop',
          params: [symbol],
        };
      });

      cds.push({
        target: addresses[NETWORK_ID].balancedOracle,
        method: 'getLastPriceInLoop',
        params: ['ICX'],
      });

      cds.push({
        target: addresses[NETWORK_ID].balancedOracle,
        method: 'getLastPriceInLoop',
        params: ['USD'],
      });

      const data: string[] = await bnJs.Multicall.getAggregateData(cds);
      const USDloop = data.pop() || '';

      const result: {
        [key: string]: BigNumber;
      } = {};

      const USDloopBN = new BigNumber(formatUnits(USDloop, 18, 6));

      data.forEach((price, index) => {
        if (price != null) {
          const symbol = index < data.length - 1 ? fixWrongSymbol(oracleSymbols[index]) : 'ICX';
          result[symbol] = new BigNumber(formatUnits(price, 18, 6)).dividedBy(USDloopBN);
        }
      });

      //get prices based on Pyth oracle
      if (PYTH_PRICED_TOKENS) {
        const ids = PYTH_PRICED_TOKENS.map(token => `ids%5B%5D=${token.pythId}`).join(',');
        const response = await axios.get<{ parsed: { id: string; price: { price: string; expo: number } }[] }>(
          `https://hermes.pyth.network/v2/updates/price/latest?${ids}`,
        );
        const data = response?.data;

        if (data.parsed) {
          data.parsed.forEach(pythTokenResponse => {
            const pythToken = PYTH_PRICED_TOKENS.find(t => t.pythId === pythTokenResponse.id);
            if (pythToken) {
              result[pythToken.symbol] = new BigNumber(pythTokenResponse.price.price).times(
                10 ** pythTokenResponse.price.expo,
              );
            }
          });
        }
      }

      return result;
    },
    refetchInterval: PERIOD,
    enabled: !!oracleSymbols,
    placeholderData: keepPreviousData,
  });

  return useMemo(() => query?.data || {}, [query?.data]);
}
