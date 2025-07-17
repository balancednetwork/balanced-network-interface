import BigNumber from 'bignumber.js';
import { IntentStatusCode } from '@sodax/sdk';

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
