import { BigNumber } from 'bignumber.js';
import { DEFAULT_MAX_RETRY, DEFAULT_RETRY_DELAY_MS } from '../constants.js';
import { encode as rlpEncode } from 'rlp';

export async function retry<T>(
  action: (retryCount: number) => Promise<T>,
  retryCount: number = DEFAULT_MAX_RETRY,
  delayMs = DEFAULT_RETRY_DELAY_MS,
): Promise<T> {
  do {
    try {
      return await action(retryCount);
    } catch (e) {
      retryCount--;

      if (retryCount <= 0) {
        console.error(`Failed to perform operation even after ${DEFAULT_MAX_RETRY} attempts.. Throwing origin error..`);
        throw e;
      }
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  } while (retryCount > 0);

  throw new Error(`Retry exceeded MAX_RETRY_DEFAULT=${DEFAULT_MAX_RETRY}`);
}

export function isValidHex(str: unknown): boolean {
  if (typeof str !== 'string') return false;
  return /^0x[0-9a-fA-F]+$/.test(str);
}

export function bigNumberToHex(value: BigNumber): string {
  const integerPart = value.integerValue(BigNumber.ROUND_FLOOR);
  return '0x' + integerPart.toString(16);
}

export function lastBytesOf(x: bigint, i: number): Uint8Array {
  const buffer = new ArrayBuffer(i);
  const view = new DataView(buffer);
  for (let j = 0; j < i; j++) {
    view.setUint8(j, Number((x >> BigInt(8 * (i - j - 1))) & BigInt(0xff)));
  }
  return new Uint8Array(buffer);
}

export function uintToBytes(x: bigint): Uint8Array {
  if (x === BigInt(0)) {
    return new Uint8Array([0]);
  }
  let right = BigInt(0x80);
  for (let i = 1; i < 32; i++) {
    if (x < right) {
      return lastBytesOf(x, i);
    }
    right <<= BigInt(8);
  }
  if (x < right) {
    return rlpEncode(x);
  } else {
    const data = rlpEncode(x);
    data[0] = 0;
    return data;
  }
}
