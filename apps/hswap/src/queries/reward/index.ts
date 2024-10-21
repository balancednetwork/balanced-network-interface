import { useMemo } from 'react';

import { ORACLE_PRICED_TOKENS } from '@/constants/tokens';
import { useTokenPrices } from '@/queries/backendv2';

import { useOraclePrices } from '@/store/oracle/hooks';

export const BATCH_SIZE = 10;

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
