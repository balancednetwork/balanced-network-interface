import BigNumber from 'bignumber.js';
import {
  getSupportedSolverTokens,
  supportedSpokeChains,
  IntentStatusCode,
  SpokeChainId,
  Token as SodaxToken,
} from '@sodax/sdk';
import { Currency, XChainId } from '@balancednetwork/sdk-core';
import { convertCurrency, XChain, xChains, XToken } from '@balancednetwork/xwagmi';
import { SODAX_CHAINS } from './chains';

export function scaleTokenAmount(amount: number | string, decimals: number): bigint {
  return BigInt(
    new BigNumber(amount.toString()).multipliedBy(new BigNumber(10).pow(decimals)).toFixed(0, BigNumber.ROUND_DOWN),
  );
}

export const slippage = 1; // 1%

export const normaliseTokenAmount = (amount: bigint | number, decimals: number): string => {
  return new BigNumber(amount.toString()).div(10 ** decimals).toFixed();
};

export const calculateExchangeRate = (amount1: BigNumber, amount2: BigNumber): BigNumber => {
  if (amount1.isZero() || amount2.isZero()) {
    return new BigNumber(0);
  }
  return amount2.div(amount1);
};

export function statusCodeToMessage(status: IntentStatusCode): string {
  switch (status) {
    case IntentStatusCode.NOT_FOUND:
      return 'NOT_FOUND';
    case IntentStatusCode.NOT_STARTED_YET:
      return 'NOT_STARTED_YET';
    case IntentStatusCode.SOLVED:
      return 'SOLVED';
    case IntentStatusCode.STARTED_NOT_FINISHED:
      return 'STARTED_NOT_FINISHED';
    case IntentStatusCode.FAILED:
      return 'FAILED';
    default:
      return 'UNKNOWN';
  }
}

export const getSupportedXChainForIntentToken = (currency?: Currency | XToken | null): XChain[] => {
  if (!currency) return [];

  const xChainIds = [] as XChainId[];

  [...SODAX_CHAINS].forEach(chain => {
    const chainTokens = getSupportedSolverTokens(chain as SpokeChainId);
    if (chainTokens.some(token => token.symbol === currency.symbol)) {
      xChainIds.push(chain as XChainId);
    }
  });

  return xChains.filter(xChain => xChainIds.includes(xChain.xChainId));
};

export const getSupportedXChainIdsForIntentToken = (currency?: Currency | XToken | null): XChainId[] => {
  if (!currency) return [];

  const xChainIds = [] as XChainId[];

  [...SODAX_CHAINS].forEach(chain => {
    const chainTokens = getSupportedSolverTokens(chain as SpokeChainId);
    if (chainTokens.some(token => token.symbol === currency.symbol)) {
      xChainIds.push(chain as XChainId);
    }
  });

  return xChainIds;
};

export const convertCurrencyWithSodax = (
  xChainId: XChainId,
  currency: Currency | XToken | undefined,
): XToken | undefined => {
  if (!currency) return undefined;

  const convertedXCurrency = convertCurrency(xChainId, currency);

  if (convertedXCurrency) return convertedXCurrency;

  const sodaxTokens = getSupportedSolverTokens(xChainId as SpokeChainId);
  const sodaxToken = sodaxTokens.find(t => t.symbol === currency.symbol);
  if (sodaxToken)
    return new XToken(xChainId, xChainId, sodaxToken.address, sodaxToken.decimals, sodaxToken.symbol, sodaxToken.name);

  return undefined;
};
