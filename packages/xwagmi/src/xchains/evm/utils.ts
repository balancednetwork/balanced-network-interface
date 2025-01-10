import { uintToBytes } from '@/utils';
import { RLP } from '@ethereumjs/rlp';

export function tokenData(method: string, params: Record<string, any>): string {
  const map = {
    method: method,
    params: params,
  };

  return JSON.stringify(map);
}

// // add liquidity
// function getAddLPData(
//   baseToken: string,
//   quoteToken: string,
//   baseValue: number,
//   quoteValue: number,
//   withdrawUnused: boolean,
//   slippagePercentage: number,
// ): Uint8Array {
//   let rlpInput: rlp.Input = [
//     'xAdd',
//     baseToken,
//     quoteToken,
//     baseValue,
//     quoteValue,
//     withdrawUnused ? 1 : 0,
//     slippagePercentage,
//   ];
//   return rlp.encode(rlpInput);
// }

// stake
export function getStakeData(to: string, poolId: number, amount: bigint): Uint8Array {
  return RLP.encode(['xhubtransfer', Buffer.from(to, 'utf-8'), uintToBytes(amount), poolId, Buffer.alloc(0)]);
}

// // claim rewards
// function getClaimRewardData(to: string, sources: string[]): Uint8Array {
//   let rlpInput: rlp.Input = ['xclaimrewards', to, sources];
//   return rlp.encode(rlpInput);
// }

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
  return RLP.encode(['xwithdraw', token, amount]);
}
