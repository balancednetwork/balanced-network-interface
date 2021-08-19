import { Currency } from 'types/balanced-sdk-core';

import { SupportedChainId } from './chains';
import {
  sICX, //
  bnUSD,
  IUSDC,
  USDS,
  sICX_YEOUIDO,
  bnUSD_YEOUIDO,
  IUSDC_YEOUIDO,
  USDS_YEOUIDO,
} from './tokens';

type ChainCurrencyList = {
  readonly [chainId: number]: Currency[];
};
/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [SupportedChainId.MAINNET]: [
    sICX, //
    bnUSD,
    IUSDC,
    USDS,
  ],
  [SupportedChainId.YEOUIDO]: [
    sICX_YEOUIDO, //
    bnUSD_YEOUIDO,
    IUSDC_YEOUIDO,
    USDS_YEOUIDO,
  ],
};
