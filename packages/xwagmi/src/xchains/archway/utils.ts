import { Token } from '@balancednetwork/sdk-core';

import { XToken } from '@/types';

export function isDenomAsset(token: XToken | Token): boolean {
  return token.address.startsWith('ibc/');
}
