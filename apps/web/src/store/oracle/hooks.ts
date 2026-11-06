import { useMemo } from 'react';

import { CallData, addresses } from '@balancednetwork/balanced-js';
import { bnJs } from '@balancednetwork/xwagmi';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import { NETWORK_ID } from '@/constants/config';
import { ORACLE_PRICED_TOKENS, PYTH_PRICED_TOKENS } from '@/constants/tokens';
import { useCollateralType, useSupportedCollateralTokens } from '@/store/collateral/hooks';
import { fixWrongSymbol } from '@/utils/formatter';
import { parseUsdPrices } from './usdPrices';

export function useOraclePrice(symbol?: string): BigNumber | undefined {
  const oraclePrices = useOraclePrices();
  const collateralType = useCollateralType();

  return useMemo(() => {
    if (oraclePrices) return oraclePrices[symbol || collateralType];
  }, [oraclePrices, collateralType, symbol]);
}

// fetch price data every 10 secs
const PERIOD = 10 * 1000;

export function useOraclePrices() {
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();

  const supportedSymbols = useMemo(
    () => supportedCollateralTokens && Object.keys(supportedCollateralTokens),
    [supportedCollateralTokens],
  );

  const oracleSymbols = useMemo(
    () =>
      supportedSymbols
        ? [
            ...new Set([
              ...ORACLE_PRICED_TOKENS,
              ...supportedSymbols,
              ...PYTH_PRICED_TOKENS.map(token => token.symbol),
              'ICX',
            ]),
          ]
        : undefined,
    [supportedSymbols],
  );

  const query = useQuery({
    queryKey: ['oracleUsdPrices', oracleSymbols],
    queryFn: async () => {
      if (!oracleSymbols) {
        return;
      }
      const aliases: Record<string, string> = {
        WETH: 'ETH',
        WBTC: 'BTC',
        cbBTC: 'BTC',
        afSUI: 'AFSUI',
        haSUI: 'HASUI',
        vSUI: 'VSUI',
        JitoSOL: 'JITOSOL',
      };
      const cds: CallData[] = oracleSymbols.map(symbol => ({
        target: addresses[NETWORK_ID].balancedOracle,
        method: 'getLastPriceInUSD',
        params: [aliases[symbol] || symbol],
      }));
      // A stale ICX feed must not prevent BTC and other collateral from being priced.
      // Multicall preserves successful USD reads when another feed is unavailable.
      const data = await bnJs.Multicall.getAggregateData(cds);
      const result = parseUsdPrices(oracleSymbols.map(fixWrongSymbol), data);

      return result;
    },
    refetchInterval: PERIOD,
    enabled: !!oracleSymbols,
    placeholderData: keepPreviousData,
  });

  return useMemo(() => query?.data || {}, [query?.data]);
}
