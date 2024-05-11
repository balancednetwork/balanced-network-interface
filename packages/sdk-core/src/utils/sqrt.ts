import invariant from 'tiny-invariant';

export const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

const ZERO = 0n;
const ONE = 1n;
const TWO = 2n;

/**
 * Computes floor(sqrt(value))
 * @param value the value for which to compute the square root, rounded down
 */
export function sqrt(value: bigint): bigint {
  invariant(value >= ZERO, 'NEGATIVE');

  // rely on built in sqrt if possible
  if (value < MAX_SAFE_INTEGER) {
    return BigInt(Math.floor(Math.sqrt(Number(value))));
  }

  let z: bigint;
  let x: bigint;
  z = value;
  x = value / TWO + ONE;
  while (x < z) {
    z = x;
    x = (value / x + x) / TWO;
  }
  return z;
}
