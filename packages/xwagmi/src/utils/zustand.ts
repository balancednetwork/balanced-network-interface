import { allXTokens } from '@/constants/xTokens';
import { CurrencyAmount } from '@balancednetwork/sdk-core';

export const jsonStorageOptions: {
  reviver?: (key: string, value: unknown) => unknown;
  replacer?: (key: string, value: unknown) => unknown;
} = {
  reviver: (_key: string, value: unknown) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    // @ts-ignore
    if (value && value.type === 'bigint') {
      // @ts-ignore
      return BigInt(value.value);
    }

    // @ts-ignore
    if (value && value.type === 'CurrencyAmount') {
      // @ts-ignore
      return CurrencyAmount.fromRawAmount(allXTokens.find(t => t.id === value.value.tokenId)!, value.value.quotient);
    }
    return value;
  },
  replacer: (_key: unknown, value: unknown) => {
    if (typeof value === 'bigint') {
      return { type: 'bigint', value: value.toString() };
    }

    if (value instanceof CurrencyAmount) {
      return {
        type: 'CurrencyAmount',
        value: {
          tokenId: value.currency.id,
          quotient: value.quotient.toString(),
        },
      };
    }

    return value;
  },
};
