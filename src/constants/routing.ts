import { Currency, Percent } from 'types/balanced-sdk-core';
import JSBI from 'jsbi'

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

export const MAX_HOPS = 3;

// one basis JSBI.BigInt
const BIPS_BASE = JSBI.BigInt(10000)
export const ONE_BIPS = new Percent(JSBI.BigInt(1), BIPS_BASE)

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), BIPS_BASE);

export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')
