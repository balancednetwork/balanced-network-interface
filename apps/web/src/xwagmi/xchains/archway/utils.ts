import { Token } from '@balancednetwork/sdk-core';

import { NETWORK_ID } from '@/constants/config';

import { StdFee } from '@archwayhq/arch3.js';

export function getFeeParam(fee: number): StdFee | 'auto' {
  return NETWORK_ID === 1
    ? 'auto'
    : {
        amount: [{ amount: '56000000000000000', denom: 'aconst' }],
        gas: `${fee}`,
      };
}

export function isDenomAsset(token: Token): boolean {
  return token.address.startsWith('ibc/');
}
