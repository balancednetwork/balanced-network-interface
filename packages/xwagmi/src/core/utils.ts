import { uintToBytes } from '@/utils';
import { RLP } from '@ethereumjs/rlp';

export function tokenData(method: string, params: Record<string, any>): string {
  const map = {
    method: method,
    params: params,
  };

  return JSON.stringify(map);
}

// add liquidity
export function getAddLPData(
  baseToken: string,
  quoteToken: string,
  baseValue: bigint,
  quoteValue: bigint,
  withdrawUnused: boolean,
  slippagePercentage: bigint,
): Uint8Array {
  return RLP.encode([
    'xAdd',
    baseToken,
    quoteToken,
    uintToBytes(baseValue),
    uintToBytes(quoteValue),
    withdrawUnused ? uintToBytes(1n) : uintToBytes(0n),
    uintToBytes(slippagePercentage),
  ]);
}

// stake
export function getStakeData(to: string, poolId: number, amount: bigint): Uint8Array {
  return RLP.encode(['xhubtransfer', Buffer.from(to, 'utf-8'), uintToBytes(amount), poolId, Buffer.alloc(0)]);
}

// unstake
export function getUnStakeData(poolId: number, amount: bigint): Uint8Array {
  return RLP.encode(['xunstake', poolId, uintToBytes(amount)]);
}

// remove liquidity
export function getXRemoveData(poolId: number, lpTokenBalance: bigint, withdraw: boolean): Uint8Array {
  return RLP.encode(['xremove', poolId, uintToBytes(lpTokenBalance), withdraw ? uintToBytes(1n) : uintToBytes(0n)]);
}

// withdraw the deposited amount
export function getWithdrawData(token: string, amount: bigint): Uint8Array {
  return RLP.encode(['xwithdraw', token, uintToBytes(amount)]);
}

// claim rewards
export function getClaimRewardData(to: string, sources: string[]): Uint8Array {
  return RLP.encode(['xclaimrewards', to, sources]);
}

//
export function getLockData(method: string, params: Record<string, any>): Buffer {
  const map = {
    method: method,
    params: params,
  };
  const jsonString = JSON.stringify(map);
  return Buffer.from(jsonString, 'utf-8');
}
