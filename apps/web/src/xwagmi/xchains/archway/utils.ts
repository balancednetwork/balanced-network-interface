import { Token } from '@balancednetwork/sdk-core';

import { StdFee } from '@archwayhq/arch3.js';

export function getFeeParam(fee: number): StdFee | 'auto' {
  return 'auto';
}

export function isDenomAsset(token: Token): boolean {
  return token.address.startsWith('ibc/');
}