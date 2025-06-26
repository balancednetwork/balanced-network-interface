import BigNumber from 'bignumber.js';
import { IntentStatusCode } from '@sodax/sdk';

export function scaleTokenAmount(amount: number | string, decimals: number): bigint {
  return BigInt(
    new BigNumber(amount.toString()).multipliedBy(new BigNumber(10).pow(decimals)).toFixed(0, BigNumber.ROUND_DOWN),
  );
}

export function normaliseTokenAmount(amount: number | string | bigint, decimals: number): string {
  return new BigNumber(amount.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimals, BigNumber.ROUND_DOWN);
}

export function calculateExchangeRate(amount: BigNumber, toAmount: BigNumber): BigNumber {
  return new BigNumber(1).dividedBy(amount).multipliedBy(toAmount);
}

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
